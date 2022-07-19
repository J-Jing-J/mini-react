import { updateClassComponent, updateFragmentComponent, updateFunctionComponent, updateHostComponent, updateHostTextComponent } from "./ReactFiberReconciler";
import { ClassComponent, Fragment, FunctionComponent, HostComponent, HostText } from "./ReactWorkTags"

let wip = null // work in progress 正在执行的fiber

// 记录根节点，避免遍历时节点变化找不到根节点
let wipRoot = null
// 初次 渲染/更新
export function scheduleUpdateOnFiber(fiber) {
  wip = fiber;
  wipRoot = fiber
}

// 更显当前组件
function performUnitOfWork () {
  const {tag} = wip  // 不同类型的组件更新方式不一样
  switch (tag) {
    case HostComponent:
      updateHostComponent(wip)
      break;
  
    case FunctionComponent:
      updateFunctionComponent()
      break;

    case ClassComponent:
      updateClassComponent()
      break;

    case Fragment:
      updateFragmentComponent()
      break;

    case HostText:
      updateHostTextComponent()
      break;

    default:
      break;
  }

  // 更新下一个 深度优先遍历
  //顺序：子、兄、上层的兄
  if(wip.child) {
    wip = wip.child
    return
  }

  let next = wip;

  while(wip) {
    if(wip.sibling) {
      wip = next.sibling
      return
    }
    next = next.return;
  }
}

