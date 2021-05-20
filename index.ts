import { Subject } from 'rxjs';

export class InlineWorker {
  private readonly worker: Worker;

  private _onMessage = new Subject<MessageEvent>();
  onMessage = this._onMessage.asObservable();

  private _onError = new Subject<ErrorEvent>();
  onError = this._onError.asObservable();

  constructor(
    func: Function,
    funcArgs?: any,
    exeFunc = true
  ) {
    if (!Worker) throw new Error('WebWorker is not enabled');

    const functionBody = `self.onmessage = function(event) {
      (${func.toString()})(event.data);
    }`;

    this.worker = new Worker(URL.createObjectURL(
      new Blob([ functionBody ], { type: 'text/javascript' })
    ));

    if (exeFunc) this.worker.postMessage(funcArgs);

    this.worker.onmessage = (data: any): void => {
      this._onMessage.next(data);
    };

    this.worker.onerror = (data: any): void => {
      this._onError.next(data);
    };
  }

  exe(inputFuncArgs: any): void {
    this.worker.postMessage(inputFuncArgs);
  }

  terminate(): void {
    if (!this.worker) return;
    this.worker.terminate();
    this._onMessage.complete();
    this._onError.complete();
  }
}
