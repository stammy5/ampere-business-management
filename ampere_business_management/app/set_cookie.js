
// Script to set cookie and redirect
document.cookie = 'session-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjRiMzdjNDk0LTdhMTUtNDk5Ni04YjUwLWMxOTc5ODhkOTEzYiIsImVtYWlsIjoiemFjayIsIm5hbWUiOiJaYWNrIiwicm9sZSI6IlNVUEVSQURNSU4iLCJmaXJzdE5hbWUiOiJaYWNrIiwibGFzdE5hbWUiOiJBZG1pbiIsImNvbXBhbnlOYW1lIjoiQW1wZXJlIEVuZ2luZWVyaW5nIFB0ZSBMdGQiLCJpYXQiOjE3NTgyODE2MzYsImV4cCI6MTc1ODM2ODAzNn0.sNrp8HBQVHm_gKwwIK4sevDcbiMf2LeuULUu3PRGKYg; path=/; max-age=86400';
console.log('Cookie set, redirecting to dashboard...');
window.location.href = '/dashboard';

