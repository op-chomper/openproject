import { toggleElement, toggleElementByVisibility } from 'core-app/shared/helpers/dom-helpers';
import { ApplicationController } from 'stimulus-use';

export default class OpShowWhenValueSelectedController extends ApplicationController {
  static targets = ['cause', 'effect'];

  declare readonly effectTargets:HTMLInputElement[];

  private boundListener = this.toggleDisabled.bind(this);

  causeTargetConnected(target:HTMLElement) {
    target.addEventListener('change', this.boundListener);
    // Reconcile the effect targets against the current value on load, so the
    // conditional fields render correctly without requiring the user to toggle.
    this.applyFor(target as HTMLInputElement);
  }

  causeTargetDisconnected(target:HTMLElement) {
    target.removeEventListener('change', this.boundListener);
  }

  private toggleDisabled(evt:Event):void {
    this.applyFor(evt.target as HTMLInputElement);
  }

  private applyFor(input:HTMLInputElement):void {
    const targetName = input.dataset.targetName;

    this
      .effectTargets
      .filter((el) => targetName === el.dataset.targetName)
      .forEach((el) => {
        const disabled = this.willDisable(el, input.value);
        el.disabled = disabled;

        if (el.dataset.setVisibility === 'true') {
          toggleElementByVisibility(el, !disabled);
        } else {
          toggleElement(el, !disabled);
        }
    });
  }

  private willDisable(el:HTMLElement, value:string):boolean {
    if (el.dataset.notValue) {
      return el.dataset.notValue === value;
    }

    return !(el.dataset.value === value);
  }
}
