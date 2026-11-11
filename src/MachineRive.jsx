import { useRive, Layout, Fit, Alignment } from '@rive-app/react-webgl2'
import './MachineRive.css'

// The "explain it like I'm 5" view: a self-contained Rive scene (drag-and-drop machine,
// fully driven by its own state machine/script — nothing here feeds it inputs).
// enableGPUCanvas is required: the machine's script draws via Rive's GPU Canvas API
// (a per-canvas WebGL context), which the plain 2D canvas renderer can't drive at all.
export default function MachineRive() {
  const { RiveComponent } = useRive({
    src: '/rive/ai-cataloging-machine.riv',
    artboard: 'ai-catalog-machine',
    stateMachine: 'Machine',
    autoplay: true,
    autoBind: true,
    enableGPUCanvas: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
  })

  return (
    <div className="mr-stage">
      <RiveComponent className="mr-canvas" />
    </div>
  )
}
