import MusicStateNode from './MusicStateNode';
import TransitionNode from './TransitionNode';
import ParameterNode from './ParameterNode';
import StingerNode from './StingerNode';
import EventNode from './EventNode';

export const nodeTypes = {
  musicState: MusicStateNode,
  transition: TransitionNode,
  parameter: ParameterNode,
  stinger: StingerNode,
  event: EventNode,
};
