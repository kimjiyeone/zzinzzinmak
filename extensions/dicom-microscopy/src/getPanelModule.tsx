import React from 'react';
import { useViewportGrid } from '@ohif/ui';
import MicroscopyPanel from './components/MicroscopyPanel/MicroscopyPanel';
import microscopyManager from './tools/microscopyManager';

// TODO:
// - No loading UI exists yet
// - cancel promises when component is destroyed
// - show errors in UI for thumbnails if promise fails

export default function getPanelModule({
  commandsManager,
  extensionManager,
  servicesManager,
}) {
  const wrappedMeasurementPanel = () => {
    const [
      { activeViewportIndex, viewports },
      viewportGridService,
    ] = useViewportGrid();

    return (
      <MicroscopyPanel
        viewports={viewports}
        activeViewportIndex={activeViewportIndex}
        microscopyManager={microscopyManager}
        onSaveComplete={() => {}}
        onRejectComplete={() => {}}
        commandsManager={commandsManager}
        servicesManager={servicesManager}
        extensionManager={extensionManager}
      />
    );
  };

  return [
    {
      name: 'measure',
      iconName: 'tab-linear',
      iconLabel: 'Measure',
      label: 'Measurements',
      secondaryLabel: 'Measurements',
      component: wrappedMeasurementPanel,
    },
  ];
}
