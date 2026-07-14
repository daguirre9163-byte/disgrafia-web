export async function inicializarDashboardModule() {
  return import("./dashboard/dashboard.js");
}

export default inicializarDashboardModule;
