// pages/Settings.js
import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import {
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import * as XLSX from 'xlsx';

function Settings() {
  const [roles, setRoles] = useState([]);
  const [projects, setProjects] = useState([]);
  const [rewardTypes, setRewardTypes] = useState([]);

  const [roleInput, setRoleInput] = useState('');
  const [projectNameInput, setProjectNameInput] = useState(''); // تعديل هنا
  const [projectLinkInput, setProjectLinkInput] = useState(''); // تعديل هنا
  const [rewardTypeInput, setRewardTypeInput] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // جلب البيانات من المستندات
      const rolesDoc = await getDoc(doc(db, 'Loyapp', 'roles'));
      const projectsDoc = await getDoc(doc(db, 'Loyapp', 'projects'));
      const rewardTypesDoc = await getDoc(doc(db, 'Loyapp', 'rewardTypes'));

      setRoles(rolesDoc.exists() ? rolesDoc.data().items || [] : []);
      setProjects(projectsDoc.exists() ? projectsDoc.data().items || [] : []);
      setRewardTypes(rewardTypesDoc.exists() ? rewardTypesDoc.data().items || [] : []);
    } catch (error) {
      console.error('Error fetching settings:', error);
      alert('حدث خطأ أثناء جلب البيانات');
    }
  };

  const handleSubmit = async (type) => {
    let value = '';
    let currentItems = [];
    let setterFunction = null;

    switch (type) {
      case 'roles':
        value = roleInput;
        currentItems = roles;
        setterFunction = setRoles;
        break;
      case 'projects':
        // تعديل هنا: الحصول على اسم المشروع والرابط
        if (!projectNameInput.trim() || !projectLinkInput.trim()) {
          alert('يرجى إدخال اسم المشروع والرابط');
          return;
        }
        value = {
          id: `project-${Date.now()}`, // معرف فريد للمشروع
          name: projectNameInput.trim(),
          link: projectLinkInput.trim(),
        };
        currentItems = projects;
        setterFunction = setProjects;
        break;
      case 'rewardTypes':
        value = rewardTypeInput;
        currentItems = rewardTypes;
        setterFunction = setRewardTypes;
        break;
      default:
        return;
    }

    if (type !== 'projects' && !value.trim()) {
      alert('يرجى إدخال قيمة');
      return;
    }

    if (type !== 'projects' && currentItems.includes(value.trim())) {
      alert('هذا العنصر موجود بالفعل');
      return;
    }

    try {
      const newItems = [...currentItems];
      if (type === 'projects') {
        newItems.push(value);
      } else {
        newItems.push(value.trim());
      }
      const docRef = doc(db, 'Loyapp', type);
      await setDoc(docRef, { items: newItems });
      setterFunction(newItems);
      // إعادة تعيين حقول الإدخال
      if (type === 'roles') setRoleInput('');
      if (type === 'projects') {
        setProjectNameInput('');
        setProjectLinkInput('');
      }
      if (type === 'rewardTypes') setRewardTypeInput('');
    } catch (error) {
      console.error('Error adding item:', error);
      alert('حدث خطأ أثناء الإضافة');
    }
  };

  const handleDelete = async (type, index) => {
    if (!window.confirm('هل أنت متأكد من الحذف؟')) return;

    let currentItems = [];
    let setterFunction = null;

    switch (type) {
      case 'roles':
        currentItems = [...roles];
        setterFunction = setRoles;
        break;
      case 'projects':
        currentItems = [...projects];
        setterFunction = setProjects;
        break;
      case 'rewardTypes':
        currentItems = [...rewardTypes];
        setterFunction = setRewardTypes;
        break;
      default:
        return;
    }

    try {
      currentItems.splice(index, 1);
      const docRef = doc(db, 'Loyapp', type);
      await setDoc(docRef, { items: currentItems });
      setterFunction(currentItems);
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('حدث خطأ أثناء الحذف');
    }
  };

  const handleExportToExcel = (type) => {
    const wb = XLSX.utils.book_new();
    let sheetData = [];
    let sheetName = '';

    switch (type) {
      case 'roles':
        sheetData = roles.map((item) => ({ 'الدور الوظيفي': item }));
        sheetName = 'الأدوار الوظيفية';
        break;
      case 'projects':
        sheetData = projects.map((item) => ({
          'اسم المشروع': item.name,
          'رابط المشروع': item.link,
        }));
        sheetName = 'المشاريع';
        break;
      case 'rewardTypes':
        sheetData = rewardTypes.map((item) => ({ 'نوع المكافأة': item }));
        sheetName = 'أنواع المكافآت';
        break;
      default:
        return;
    }

    const sheet = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, sheet, sheetName);
    XLSX.writeFile(wb, `${sheetName}.xlsx`);
  };

  return (
    <div className="container">
      <h1>إعدادات النظام</h1>

      {/* إدارة الأدوار */}
      <div className="card">
        <h2>إدارة الأدوار الوظيفية</h2>
        <div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit('roles');
            }}
          >
            <input
              type="text"
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              placeholder="أدخل الدور الوظيفي"
            />
            <button type="submit">إضافة</button>
          </form>
          <button onClick={() => handleExportToExcel('roles')}>تصدير إلى Excel</button>
          <table>
            <thead>
              <tr>
                <th>الدور الوظيفي</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role, index) => (
                <tr key={index}>
                  <td>{role}</td>
                  <td>
                    <button onClick={() => handleDelete('roles', index)}>
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* إدارة المشاريع */}
      <div className="card">
        <h2>إدارة المشاريع</h2>
        <div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit('projects');
            }}
          >
            <input
              type="text"
              value={projectNameInput}
              onChange={(e) => setProjectNameInput(e.target.value)}
              placeholder="أدخل اسم المشروع"
            />
            <input
              type="text"
              value={projectLinkInput}
              onChange={(e) => setProjectLinkInput(e.target.value)}
              placeholder="أدخل رابط المشروع"
            />
            <button type="submit">إضافة</button>
          </form>
          <button onClick={() => handleExportToExcel('projects')}>تصدير إلى Excel</button>
          <table>
            <thead>
              <tr>
                <th>اسم المشروع</th>
                <th>رابط المشروع</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project, index) => (
                <tr key={index}>
                  <td>{project.name}</td>
                  <td>{project.link}</td>
                  <td>
                    <button onClick={() => handleDelete('projects', index)}>
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* إدارة أنواع المكافآت */}
      <div className="card">
        <h2>إدارة أنواع المكافآت</h2>
        <div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit('rewardTypes');
            }}
          >
            <input
              type="text"
              value={rewardTypeInput}
              onChange={(e) => setRewardTypeInput(e.target.value)}
              placeholder="أدخل نوع المكافأة"
            />
            <button type="submit">إضافة</button>
          </form>
          <button onClick={() => handleExportToExcel('rewardTypes')}>تصدير إلى Excel</button>
          <table>
            <thead>
              <tr>
                <th>نوع المكافأة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rewardTypes.map((type, index) => (
                <tr key={index}>
                  <td>{type}</td>
                  <td>
                    <button onClick={() => handleDelete('rewardTypes', index)}>
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Settings;
