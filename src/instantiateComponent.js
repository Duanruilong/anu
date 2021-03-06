import { extend } from "../src/util";
import { Refs } from "./Refs";
import { Updater, getContextByTypes } from "./updater";
export function instantiateComponent(type, vnode, props, parentContext) {
    let context = getContextByTypes(parentContext, type.contextTypes);
    let isStateless = vnode.vtype === 4;
    let instance = isStateless
        ? {
            refs: {},
            __proto__: type.prototype,
            render: function() {
                return type(this.props, this.context);
            }
        }
        : new type(props, context);
    let updater = new Updater(instance, vnode, props, context);
    //props, context是不可变的
    instance.props = updater.props = props;
    instance.context = updater.context = context;
    instance.constructor = type;
    updater.name = type.displayName || type.name;

    if (isStateless) {
        let lastOwn = Refs.currentOwner;
        Refs.currentOwner = instance;
        try {
            var mixin = instance.render();
        } finally {
            Refs.currentOwner = lastOwn;
        }
        if (mixin && mixin.render) {
            //支持module pattern component
            extend(instance, mixin);
        } else {
            instance.__isStateless = true;
            updater.rendered = mixin;
            updater.willReceive = false;
        }
    }

    return instance;
}