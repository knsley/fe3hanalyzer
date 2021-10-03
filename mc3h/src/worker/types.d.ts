// Enumerate message types
export enum MESSAGE_TYPE {
    READY = 'ready',
    REQUEST = 'request',
    RESULT = 'result',
    ERROR = 'error'
}

export class BackgroundWorker extends Worker {
    public onmessage: (this: BackgroundWorker, ev: IMyMessageEvent) => any;

    public postMessage(this:  BackgroundWorker, msg: MyWorkerMessage, transferList?: ArrayBuffer[]): any;
    public addEventListener(type: 'message', listener: (this: BackgroundWorker, ev: IMyMessageEvent) => any, useCapture?: boolean): void;
    public addEventListener(type: 'error', listener: (this: BackgroundWorker, ev: ErrorEvent) => any, useCapture?: boolean): void;
}