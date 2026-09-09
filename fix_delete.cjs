const fs = require('fs');
let content = fs.readFileSync('frontend/components/CitizenApp.tsx', 'utf8');

const target = \`                        <div className="mt-6 flex justify-end">
                        <div className="mt-6 flex justify-end">
                          <button
                            onClick={async () => {
                              // Replaced window.confirm with direct deletion since iframes block confirm()
                              await deleteReport(report.id);
                              setView('feed');
                            }}
                            className="flex items-center gap-2 text-sm font-bold text-red-600 bg-red-50 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors shadow-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Report
                          </button>
                        </div>\`;

const rep = \`                        <div className="mt-6 flex justify-end">
                          <button
                            onClick={async () => {
                              await deleteReport(report.id);
                              setView('feed');
                            }}
                            className="flex items-center gap-2 text-sm font-bold text-red-600 bg-red-50 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors shadow-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Report
                          </button>
                        </div>\`;

content = content.replace(target, rep);
fs.writeFileSync('frontend/components/CitizenApp.tsx', content);
