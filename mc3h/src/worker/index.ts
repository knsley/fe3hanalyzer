import { BackgroundWorker } from './types';
export { MESSAGE_TYPE } from './types';

let WorkerImport = require('worker-loader!./worker');
export default WorkerImport as typeof BackgroundWorker;