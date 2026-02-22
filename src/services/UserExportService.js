
const downloadFile = (content, filename, contentType) => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const getTimestamp = () => {
  return new Date().toISOString().split('T')[0];
};

export const exportToCSV = (users) => {
  if (!users || users.length === 0) return;

  const headers = ['ID', 'Name', 'Email', 'Role', 'Plan', 'Status', 'Created At'];
  const csvContent = [
    headers.join(','),
    ...users.map(user => {
      return [
        user.id,
        `"${user.name}"`, // Quote strings to handle commas
        user.email,
        user.role,
        user.plan,
        user.status,
        user.joinedDate || new Date().toISOString()
      ].join(',');
    })
  ].join('\n');

  downloadFile(csvContent, `users_export_${getTimestamp()}.csv`, 'text/csv;charset=utf-8;');
};

export const exportToJSON = (users) => {
  if (!users || users.length === 0) return;

  const jsonContent = JSON.stringify(users, null, 2);
  downloadFile(jsonContent, `users_export_${getTimestamp()}.json`, 'application/json');
};

export const UserExportService = {
  exportToCSV,
  exportToJSON
};
