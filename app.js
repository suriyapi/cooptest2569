const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwwSTD2Hi_SiLhDEPPz3X-B3cPVGHO2E_NwbBtc00ibHv21tk8F13iElNVRS7kY-bw/exec';

const START_TIME = '2026-03-27T09:00:00+07:00';
const EXAM_END_TIME = '2026-03-27T12:00:00+07:00';
const DEADLINE = '2026-03-27T12:30:00+07:00';

const REFRESH_INTERVAL_MS = 5000;
const PAGE_SIZE = 10;

const repoData = {
  Frontend: {
    label: 'Frontend Developer',
    url: 'https://github.com/suriyapi/frontend_developer_test.git',
    clone: 'git clone https://github.com/suriyapi/frontend_developer_test.git'
  },
  Backend: {
    label: 'Backend Developer',
    url: 'https://github.com/suriyapi/backend_developer_test.git',
    clone: 'git clone https://github.com/suriyapi/backend_developer_test.git'
  },
  'Full Stack': {
    label: 'Full Stack Developer',
    url: 'https://github.com/suriyapi/full_stack_developer_test.git',
    clone: 'git clone https://github.com/suriyapi/full_stack_developer_test.git'
  }
};

let submissions = [];
let previewPage = 1;
let dashboardPage = 1;
let selectedStatus = '';

function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent = now.toLocaleString('th-TH');
}

function switchView(view) {
  const examView = document.getElementById('examView');
  const dashboardView = document.getElementById('dashboardView');
  const tabExam = document.getElementById('tabExam');
  const tabDashboard = document.getElementById('tabDashboard');

  if (view === 'exam') {
    examView.classList.remove('hidden');
    dashboardView.classList.add('hidden');
    tabExam.className = 'rounded-2xl bg-white text-green-800 font-semibold px-4 py-2';
    tabDashboard.className = 'rounded-2xl bg-white/10 text-white font-semibold px-4 py-2';
    renderExamLatestTable();
  } else {
    examView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    tabExam.className = 'rounded-2xl bg-white/10 text-white font-semibold px-4 py-2';
    tabDashboard.className = 'rounded-2xl bg-white text-green-800 font-semibold px-4 py-2';
    renderDashboardTable();
  }
}

function selectRepo(position) {
  const repo = repoData[position];
  if (!repo) return;

  document.getElementById('selectedRepoLabel').textContent = repo.label;
  document.getElementById('selectedRepoLink').textContent = repo.url;
  document.getElementById('repoUrl').textContent = repo.clone;

  const openBtn = document.getElementById('openRepoBtn');
  openBtn.href = repo.url;
  openBtn.classList.remove('pointer-events-none', 'opacity-50');

  document.querySelectorAll('.repo-btn').forEach((btn) => {
    btn.classList.remove('border-green-700', 'bg-green-50', 'ring-2', 'ring-green-200');
  });

  const idMap = {
    Frontend: 'btnFrontend',
    Backend: 'btnBackend',
    'Full Stack': 'btnFullStack'
  };

  document.getElementById(idMap[position]).classList.add(
    'border-green-700',
    'bg-green-50',
    'ring-2',
    'ring-green-200'
  );

  const positionSelect = document.querySelector('select[name="position"]');
  if (positionSelect) {
    positionSelect.value = position;
  }
}

function copyRepo() {
  const text = document.getElementById('repoUrl').textContent.trim();
  if (!text || text.includes('เลือกตำแหน่ง')) {
    alert('กรุณาเลือกตำแหน่งก่อน');
    return;
  }

  navigator.clipboard.writeText(text).then(() => {
    alert('คัดลอกคำสั่ง git clone แล้ว');
  });
}

function formatDateTime(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  return String(value).replace('T', ' ').replace('.000Z', '');
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function sortByLatest(items) {
  return [...items].sort((a, b) => {
    const timeA = new Date(a.timestamp || 0).getTime();
    const timeB = new Date(b.timestamp || 0).getTime();
    return timeB - timeA;
  });
}

function paginate(items, page) {
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  return {
    page: safePage,
    totalPages,
    items: items.slice(start, start + PAGE_SIZE)
  };
}

function updatePaginationControls(prefix, page, totalPages) {
  const pageInfo = document.getElementById(`${prefix}PageInfo`);
  const prevBtn = document.getElementById(`${prefix}PrevBtn`);
  const nextBtn = document.getElementById(`${prefix}NextBtn`);

  if (pageInfo) pageInfo.textContent = `หน้า ${page} / ${totalPages}`;
  if (prevBtn) prevBtn.disabled = page <= 1;
  if (nextBtn) nextBtn.disabled = page >= totalPages;
}

function changePreviewPage(step) {
  previewPage += step;
  renderExamLatestTable();
}

function changeDashboardPage(step) {
  dashboardPage += step;
  renderDashboardTable();
}

function updateCountdown() {
  const countdownText = document.getElementById('countdownText');
  const countdownSubtext = document.getElementById('countdownSubtext');
  const submitButton = document.getElementById('submitButton');

  if (!countdownText || !countdownSubtext) return;

  const now = Date.now();
  const start = new Date(START_TIME).getTime();
  const examEnd = new Date(EXAM_END_TIME).getTime();
  const deadline = new Date(DEADLINE).getTime();

  if (now < start) {
    const diff = start - now;
    countdownText.textContent = formatTime(diff);
    countdownText.className = 'text-2xl font-bold mt-2 text-sky-700';
    countdownSubtext.textContent = '⏳ ยังไม่ถึงเวลาเริ่มสอบ';

    if (submitButton) {
      submitButton.disabled = false;
      submitButton.classList.remove('bg-gray-400', 'cursor-not-allowed');
      submitButton.classList.add('bg-green-800', 'hover:bg-green-900');
    }
    return;
  }

  if (now >= start && now < examEnd) {
    const diff = examEnd - now;
    countdownText.textContent = formatTime(diff);
    countdownText.className = 'text-2xl font-bold mt-2 text-emerald-700';
    countdownSubtext.textContent = '🔥 กำลังสอบอยู่';

    if (submitButton) {
      submitButton.disabled = false;
      submitButton.classList.remove('bg-gray-400', 'cursor-not-allowed');
      submitButton.classList.add('bg-green-800', 'hover:bg-green-900');
    }
    return;
  }

  if (now >= examEnd && now < deadline) {
    const diff = deadline - now;
    countdownText.textContent = formatTime(diff);
    countdownText.className = 'text-2xl font-bold mt-2 text-amber-600';
    countdownSubtext.textContent = '🟠 หมดเวลาสอบแล้ว แต่ยังส่งงานล่าช้าได้';

    if (submitButton) {
      submitButton.disabled = false;
      submitButton.classList.remove('bg-gray-400', 'cursor-not-allowed');
      submitButton.classList.add('bg-green-800', 'hover:bg-green-900');
    }
    return;
  }

  countdownText.textContent = 'หมดเวลา';
  countdownText.className = 'text-2xl font-bold mt-2 text-rose-600';
  countdownSubtext.textContent = '❌ ปิดรับการส่งงานแล้ว';

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.classList.add('bg-gray-400', 'cursor-not-allowed');
    submitButton.classList.remove('bg-green-800', 'hover:bg-green-900');
  }
}

function updatePositionSummary() {
  const positions = [
    { key: 'Frontend', countId: 'frontendSummaryCount', subId: 'frontendSummarySubtext', barId: 'frontendSummaryBar' },
    { key: 'Backend', countId: 'backendSummaryCount', subId: 'backendSummarySubtext', barId: 'backendSummaryBar' },
    { key: 'Full Stack', countId: 'fullstackSummaryCount', subId: 'fullstackSummarySubtext', barId: 'fullstackSummaryBar' }
  ];

  positions.forEach(({ key, countId, subId, barId }) => {
    const positionRows = submissions.filter((item) => item.position === key);
    const submittedRows = positionRows.filter((item) =>
      ['ส่งตรงเวลา', 'ส่งล่าช้า', 'ส่งแล้ว', 'รอตรวจ', 'ผ่าน'].includes(item.status)
    );

    const countEl = document.getElementById(countId);
    const subEl = document.getElementById(subId);
    const barEl = document.getElementById(barId);
    const rate = positionRows.length ? Math.round((submittedRows.length / positionRows.length) * 100) : 0;

    if (countEl) countEl.textContent = positionRows.length;
    if (subEl) subEl.textContent = `ส่งแล้ว ${submittedRows.length} คน • ${rate}%`;
    if (barEl) barEl.style.width = `${rate}%`;
  });
}

function updateSummary() {
  const total = submissions.length;
  const submitted = submissions.filter((item) =>
    ['ส่งตรงเวลา', 'ส่งล่าช้า', 'ส่งแล้ว', 'รอตรวจ', 'ผ่าน'].includes(item.status)
  ).length;
  const pending = total - submitted;
  const rate = total ? Math.round((submitted / total) * 100) : 0;

  document.getElementById('totalCount').textContent = total;
  document.getElementById('submittedCount').textContent = submitted;
  document.getElementById('pendingCount').textContent = pending;
  document.getElementById('progressRate').textContent = `${rate}%`;

  updatePositionSummary();
}

function renderStatusBadge(status) {
  if (status === 'ส่งตรงเวลา') {
    return '<span class="rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-xs font-semibold">ส่งตรงเวลา</span>';
  }
  if (status === 'ส่งล่าช้า') {
    return '<span class="rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-semibold">ส่งล่าช้า</span>';
  }
  if (status === 'ส่งแล้ว') {
    return '<span class="rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-xs font-semibold">ส่งแล้ว</span>';
  }
  if (status === 'รอตรวจ') {
    return '<span class="rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-semibold">รอตรวจ</span>';
  }
  if (status === 'ผ่าน') {
    return '<span class="rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-semibold">ผ่าน</span>';
  }
  if (status === 'ไม่ผ่าน') {
    return '<span class="rounded-full bg-red-100 text-red-700 px-3 py-1 text-xs font-semibold">ไม่ผ่าน</span>';
  }
  return '<span class="rounded-full bg-rose-100 text-rose-700 px-3 py-1 text-xs font-semibold">ยังไม่ส่ง</span>';
}

function renderExamLatestTable() {
  const tbody = document.getElementById('previewTable');
  const sorted = sortByLatest(submissions);
  const paged = paginate(sorted, previewPage);
  previewPage = paged.page;
  const items = paged.items;

  tbody.innerHTML = items.map((item, index) => `
    <tr class="${previewPage === 1 && index === 0 ? 'bg-green-50' : 'bg-white'}">
      <td class="px-4 py-3 text-xs text-slate-600">${formatDateTime(item.timestamp)}</td>
      <td class="px-4 py-3 cell-id">${item.studentId || ''}</td>
      <td class="px-4 py-3 cell-name">${item.fullName || ''}</td>
      <td class="px-4 py-3 cell-study">${item.studyType || '-'}</td>
      <td class="px-4 py-3 cell-position">${item.position || ''}</td>
      <td class="px-4 py-3 cell-status">${renderStatusBadge(item.status || '')}</td>
      <td class="px-4 py-3">${item.score || '-'}</td>
    </tr>
  `).join('');

  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-6 text-center text-slate-500">ยังไม่มีข้อมูลใน Google Sheets</td></tr>';
  }

  updatePaginationControls('preview', paged.page, paged.totalPages);
}

function getFilteredSubmissions() {
  const keyword = document.getElementById('searchInput').value.toLowerCase().trim();
  const studyType = document.getElementById('studyTypeFilter').value;
  const position = document.getElementById('positionFilter').value;

  return submissions.filter((item) => {
    const haystack = `${item.studentId || ''} ${item.fullName || ''}`.toLowerCase();
    const matchKeyword = !keyword || haystack.includes(keyword);
    const matchStudyType = !studyType || item.studyType === studyType;
    const matchPosition = !position || item.position === position;
    const matchStatus = !selectedStatus || item.status === selectedStatus;
    return matchKeyword && matchStudyType && matchPosition && matchStatus;
  });
}

function renderDashboardTable() {
  const tbody = document.getElementById('submissionTable');
  const filtered = sortByLatest(getFilteredSubmissions());
  const paged = paginate(filtered, dashboardPage);
  dashboardPage = paged.page;
  const items = paged.items;

  tbody.innerHTML = items.map((item, index) => `
    <tr class="${dashboardPage === 1 && index === 0 ? 'bg-green-50' : 'bg-white'}">
      <td class="px-4 py-3 text-xs text-slate-600 cell-time">${formatDateTime(item.timestamp)}</td>
      <td class="px-4 py-3 cell-id">${item.studentId || ''}</td>
      <td class="px-4 py-3 cell-name" title="${item.fullName || ''}">${item.fullName || ''}</td>
      <td class="px-4 py-3 cell-study">${item.studyType || '-'}</td>
      <td class="px-4 py-3 cell-position">${item.position || ''}</td>
      <td class="px-4 py-3 cell-status">${renderStatusBadge(item.status || '')}</td>
      <td class="px-4 py-3 cell-link">${item.repoLink ? `<a class="text-green-700 underline break-all" href="${item.repoLink}" target="_blank">Repository</a>` : '-'}</td>
      <td class="px-4 py-3 cell-link">${item.demoLink ? `<a class="text-green-700 underline break-all" href="${item.demoLink}" target="_blank">Demo</a>` : '-'}</td>
    </tr>
  `).join('');

  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-6 text-center text-slate-500">ไม่พบข้อมูล</td></tr>';
  }

  const resultCount = document.getElementById('dashboardResultCount');
  if (resultCount) {
    resultCount.textContent = `${filtered.length} รายการ`;
  }

  updatePaginationControls('dashboard', paged.page, paged.totalPages);
  updateSummary();
}

async function lookupStudentById(studentId) {
  const nameInput = document.querySelector('input[name="fullName"]');
  const studyTypeInput = document.querySelector('input[name="studyType"]');
  const statusEl = document.getElementById('studentLookupStatus');

  if (!studentId) {
    nameInput.value = '';
    studyTypeInput.value = '';
    statusEl.textContent = '';
    return;
  }

  statusEl.textContent = 'กำลังค้นหาข้อมูลนิสิต...';

  try {
    const response = await fetch(`${APPS_SCRIPT_URL}?action=student&studentId=${encodeURIComponent(studentId)}&_=${Date.now()}`);
    if (!response.ok) throw new Error('ค้นหาข้อมูลนิสิตไม่สำเร็จ');
    const result = await response.json();

    if (result.success && result.data) {
      nameInput.value = result.data.fullName || '';
      studyTypeInput.value = result.data.studyType || '';
      statusEl.textContent = 'พบข้อมูลนิสิตแล้ว';
    } else {
      nameInput.value = '';
      studyTypeInput.value = '';
      statusEl.textContent = 'ไม่พบรหัสนิสิตนี้';
    }
  } catch (error) {
    nameInput.value = '';
    studyTypeInput.value = '';
    statusEl.textContent = 'ค้นหาข้อมูลไม่สำเร็จ';
    console.error(error);
  }
}

async function loadExamLatestTable() {
  const statusEl = document.getElementById('examLatestStatus');
  statusEl.textContent = 'กำลังโหลดข้อมูล...';

  try {
    const response = await fetch(`${APPS_SCRIPT_URL}?action=list&_=${Date.now()}`);
    if (!response.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ');
    const result = await response.json();

    if (result.success && Array.isArray(result.data)) {
      submissions = sortByLatest(result.data);
      previewPage = 1;
      dashboardPage = 1;
      renderExamLatestTable();
      renderDashboardTable();
      statusEl.textContent = `อัปเดตล่าสุด ${new Date().toLocaleString('th-TH')}`;
    } else {
      renderExamLatestTable();
      statusEl.textContent = 'ไม่สามารถอ่านข้อมูลได้';
    }
  } catch (error) {
    renderExamLatestTable();
    statusEl.textContent = 'โหลดข้อมูลไม่สำเร็จ';
    console.error(error);
  }
}

async function loadSubmissions() {
  const statusEl = document.getElementById('dashboardStatus');
  statusEl.textContent = 'กำลังโหลดข้อมูล...';

  try {
    const response = await fetch(`${APPS_SCRIPT_URL}?action=list&_=${Date.now()}`);
    if (!response.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ');
    const result = await response.json();

    if (result.success && Array.isArray(result.data)) {
      submissions = sortByLatest(result.data);
      previewPage = 1;
      dashboardPage = 1;
      renderDashboardTable();
      renderExamLatestTable();

      const nowText = new Date().toLocaleString('th-TH');
      statusEl.textContent = `อัปเดตล่าสุด ${nowText} · รีเฟรชทุก ${REFRESH_INTERVAL_MS / 1000} วินาที`;

      const examStatusEl = document.getElementById('examLatestStatus');
      if (examStatusEl) {
        examStatusEl.textContent = `อัปเดตล่าสุด ${nowText}`;
      }
    } else {
      submissions = [];
      renderDashboardTable();
      renderExamLatestTable();
      statusEl.textContent = 'ไม่สามารถอ่านข้อมูลได้';
    }
  } catch (error) {
    statusEl.textContent = 'โหลดข้อมูลไม่สำเร็จ';
    renderDashboardTable();
    renderExamLatestTable();
    console.error(error);
  }
}

function getSubmissionStatusByTime() {
  const now = Date.now();
  const examEnd = new Date(EXAM_END_TIME).getTime();
  const deadline = new Date(DEADLINE).getTime();

  if (now <= examEnd) {
    return 'ส่งตรงเวลา';
  }

  if (now > examEnd && now <= deadline) {
    return 'ส่งล่าช้า';
  }

  return 'ปิดรับแล้ว';
}

function clearFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('studyTypeFilter').value = '';
  document.getElementById('positionFilter').value = '';
  selectedStatus = '';
  dashboardPage = 1;

  document.querySelectorAll('.filter-chip').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.status === '');
  });

  renderDashboardTable();
}

function bindDashboardFilters() {
  document.getElementById('searchInput').addEventListener('input', () => {
    dashboardPage = 1;
    renderDashboardTable();
  });

  document.getElementById('studyTypeFilter').addEventListener('change', () => {
    dashboardPage = 1;
    renderDashboardTable();
  });

  document.getElementById('positionFilter').addEventListener('change', () => {
    dashboardPage = 1;
    renderDashboardTable();
  });

  document.querySelectorAll('.filter-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      selectedStatus = chip.dataset.status || '';
      dashboardPage = 1;

      document.querySelectorAll('.filter-chip').forEach((btn) => btn.classList.remove('active'));
      chip.classList.add('active');
      renderDashboardTable();
    });
  });

  document.getElementById('clearFiltersBtn').addEventListener('click', clearFilters);
}

function bindFormEvents() {
  document.querySelector('select[name="position"]').addEventListener('change', (e) => {
    const selected = e.target.value;
    if (selected) {
      selectRepo(selected);
    }
  });

  document.querySelector('input[name="studentId"]').addEventListener('change', (e) => {
    lookupStudentById(e.target.value.trim());
  });

  document.querySelector('input[name="studentId"]').addEventListener('blur', (e) => {
    lookupStudentById(e.target.value.trim());
  });

  document.querySelector('input[name="studentId"]').addEventListener('input', (e) => {
    const studentId = e.target.value.trim();
    if (studentId.length >= 8) {
      lookupStudentById(studentId);
    }
  });

  document.getElementById('submissionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = Object.fromEntries(new FormData(form).entries());
    formData.timestamp = new Date().toISOString();
    formData.status = getSubmissionStatusByTime();
    formData.score = '';

    const status = document.getElementById('formStatus');
    status.textContent = 'กำลังส่งข้อมูล...';

    if (!formData.fullName || !formData.studyType) {
      status.textContent = 'กรุณากรอกรหัสนิสิตที่ถูกต้องเพื่อดึงข้อมูลอัตโนมัติก่อนส่ง';
      return;
    }

    if (formData.status === 'ปิดรับแล้ว') {
      status.textContent = 'หมดเวลารับส่งงานแล้ว';
      return;
    }

    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('ส่งข้อมูลไม่สำเร็จ');
      const result = await res.json();

      if (result.success) {
        status.textContent = `ส่งข้อมูลเรียบร้อยแล้ว (${formData.status})`;
        form.reset();

        document.getElementById('repoUrl').textContent = 'เลือกตำแหน่งเพื่อแสดงคำสั่ง git clone';
        document.getElementById('selectedRepoLabel').textContent = 'ยังไม่ได้เลือกตำแหน่ง';
        document.getElementById('selectedRepoLink').textContent = 'กรุณาเลือกตำแหน่งก่อน';
        document.getElementById('studentLookupStatus').textContent = '';

        document.querySelectorAll('.repo-btn').forEach((btn) => {
          btn.classList.remove('border-green-700', 'bg-green-50', 'ring-2', 'ring-green-200');
        });

        const openBtn = document.getElementById('openRepoBtn');
        openBtn.href = '#';
        openBtn.classList.add('pointer-events-none', 'opacity-50');

        loadSubmissions();
      } else {
        status.textContent = `ส่งข้อมูลไม่สำเร็จ: ${result.message || 'Unknown error'}`;
      }
    } catch (error) {
      status.textContent = 'เกิดข้อผิดพลาดในการส่งข้อมูล';
      console.error(error);
    }
  });
}

function init() {
  bindFormEvents();
  bindDashboardFilters();
  setInterval(updateClock, 1000);
  setInterval(updateCountdown, 1000);
  updateClock();
  updateCountdown();
  renderDashboardTable();
  renderExamLatestTable();
  loadSubmissions();
  setInterval(loadSubmissions, REFRESH_INTERVAL_MS);
}

document.addEventListener('DOMContentLoaded', init);
