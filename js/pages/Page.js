define([
  'knockout',
  'components/Component',
  'lodash'
], function (
  ko,
  Component,
  _,
) {
  function detectChanges(newVal, oldVal) {
    let nn = newVal[0], nv = newVal[1], on = oldVal[0], ov = oldVal[1];
    if (nn instanceof Function) {
      nn = nn();
    }
    if (nv instanceof Function) {
      nv = nv();
    }
    if (on instanceof Function) {
      on = on();
    }
    if (ov instanceof Function) {
      ov = ov();
    }

    return nn === on && nv === ov;
  }

  class Page extends Component {
    constructor(params) {
      super(params);
      this.routerParams = params.router.routerParams();
      this.activeRoute = params.router.activeRoute();
      this.subscriptions.push(params.router.routerParams.subscribe(newParams => {
        const np = Object.entries(newParams === undefined ? {} : newParams);
        const op = Object.entries(this.routerParams === undefined ? {} : this.routerParams);
        const changedParams = _.differenceWith(np, op, detectChanges);
        if (changedParams.length === 0 || this.activeRoute.title !== params.router.activeRoute().title) {
          return;
        }
        const changedParamsMap = changedParams.reduce((map, value) => { map[value[0]] = value[1]; return map; }, {});

        this.onRouterParamsChanged(changedParamsMap, newParams);
        this.routerParams = newParams;
      }));
    }

    onRouterParamsChanged(newParams) {

    }

    onPageCreated() {
      this.onRouterParamsChanged(this.routerParams);
    }
  }

  return Page;
});
