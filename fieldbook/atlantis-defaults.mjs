// Confirmed set corrections also apply to older browser saves without replacing edits.
export function applyAtlantisDefaults(project){
  if(project.name!=='Atlantis'||!(project.templateRevision>=14&&project.templateRevision<15))return;
  const settings=project.settings?.['Golden Valley 2026 Mvt 1'];
  if(settings){
    settings.durations??={};settings.motionCounts??={};
    settings.durations['5']??=32;
    settings.motionCounts['5']??=10;
  }
  project.templateRevision=15;
}
