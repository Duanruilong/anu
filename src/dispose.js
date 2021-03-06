import { options, noop, innerHTML } from "./util";
import { removeElement } from "./browser";
import { Refs } from "./Refs";
import { captureError } from "./scheduler";
import { removeCache,restoreChildren } from "./cacheTree";


export function disposeVnode(vnode) {
    if (!vnode || vnode._disposed) {
        return;
    }
    var instance = vnode._instance;
    if (vnode._hasRef) {
        vnode._hasRef = false;
        Refs.fireRef(vnode, null);
    }
    if (instance) {
        disposeComponent(vnode, instance);
    } else if (vnode.vtype === 1) {
        disposeElement(vnode);
    }
    removeCache(vnode);
    vnode._disposed = true;
}

function disposeElement(vnode) {
    var { props } = vnode;
    if (props[innerHTML]) {
        removeElement(vnode._hostNode);
    } else {
        var vchildren = restoreChildren(vnode);
        for (let i = 0, n = vchildren.length; i < n; i++) {
            disposeVnode(vchildren[i]);
        }
    }
}

function disposeComponent(vnode, instance) {
    options.beforeUnmount(instance);
    instance.setState = instance.forceUpdate = noop;
    captureError(instance, "componentWillUnmount", []);
    let updater = instance.updater;
    //在执行componentWillUnmount后才将关联的元素节点解绑，防止用户在钩子里调用 findDOMNode方法
    disposeVnode(updater.rendered);
    updater._disposed = true;
    updater._renderInNextCycle = vnode._instance = instance.updater = null;
}
