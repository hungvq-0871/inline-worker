# inline-worker
A small script file help execute functions in `Web Worker`, it makes use of `rxjs` to help working with messages posted via threads easier making it very suitable to be imported to Angular project need the power of `Web Worker` with ease.

## Examples
Below is a couter function which will then be passed to the `InlineWorker` class offered by the `inline-worker` script.
```ts
export interface CountdownTimerArgs {
  startCountdownTime: number;
  deplay: number;
}

export interface CountdownTimerOutput {
  elapsedTime: number;
  isCountdownEnded: boolean;
}

export function countdownTimerWorker({
  startCountdownTime,
  deplay
}: CountdownTimerArgs): void {
  let iterations = 0;

  const intervalRef = setInterval((): void => {
    iterations++;
    const elapsedTime = (startCountdownTime > 0) ? startCountdownTime - iterations * deplay : 0;
    this.postMessage({
      elapsedTime,
      isCountdownEnded: false
    });

    if (elapsedTime <= 0) {
      clearInterval(intervalRef);

      this.postMessage({
        elapsedTime,
        isCountdownEnded: true
      });
    }
  }, deplay);
}
```

Below is an example of how a class in Angular can use the `InlineWorker` class

```ts
// ...
import { InlineWorker } from '../functions/inline-worker-executor';
import { CountdownTimerOutput, countdownTimerWorker } from '../workers/count-down-timer.worker';

// ...
  ngOnInit(): void {
    const countdownWorker = new InlineWorker(countdownTimerWorker, undefined, false);
    countdownWorker.onMessage.subscribe(({ data }: { data: CountdownTimerOutput }): void => {
      if (!data.isCountdownEnded) {
        this.onCountDown.emit(data.elapsedTime);
        return;
      }

      countdownWorker.terminate();
      this.onCountdownEnd();
    });

    this.startCountDown$.pipe(
      filter((shouldStart: boolean): boolean => shouldStart),
      tap((): void => {
        countdownWorker.exe({
        startCountdownTime: this.elapsedTime,
        deplay: this.interval
      }),
      takeUntil(this.stopCountDown$),
    ).subscribe();
  }
// ...
```

### API
#### Constructor
```
InlineWorker(
  func: Function,
  funcArgs?: any,
  exeFunc = true
)
```
* `func`: the function need executing in the `Web Worker` thread.
* `funcArgs`: arguments of the function `func`.
* `exeFunc`: if `true`, execute the function `func` immediately after the constructor function is initialized.

#### Methods
`exe(inputFuncArgs: any): void`
* executing the function `func` passed to the constructor function, it receives an argument which is used to call the function `func`.
* This is under the hood just a wrapper for the `this.worker.postMessage` method which could cause stiff understanding curve for people who are not familiar with `Web Worker`.

`terminate(): void`
* terminate the currently running `Web Worker` thread created by the `InlineWorker` class as well as clear inner observables.

#### Properties
`onMessage: <MessageEvent>Observable`
* An observable could be used to get messages posted from the `worker` thread to the browser.

`onError: : <MessageEvent>Observable`
* Similar to the method `onMessage`.
