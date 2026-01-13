import GanttTableTimelineA from './GanttTableTimelineA';
import GanttTableTimelineB from './GanttTableTimelineB';
import GanttTableTimelineC from './GanttTableTimelineC';

function GanttTableTimeline({ mode = 'A', rows, setRows, exporting, setExporting }) {
  switch (mode) {
    case 'B':
      return <GanttTableTimelineB rows={rows} setRows={setRows} exporting={exporting} setExporting={setExporting} />;
    case 'C':
      return <GanttTableTimelineC rows={rows} setRows={setRows} exporting={exporting} setExporting={setExporting} />;
    case 'A':
    default:
      return <GanttTableTimelineA rows={rows} setRows={setRows} exporting={exporting} setExporting={setExporting} />;
  }
}

export default GanttTableTimeline;
