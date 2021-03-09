let x2jsone = null,
  //当前右键操作的td DOM
  contextMenuElement = null
window.onload = function () {
  x2jsone = new X2JS()
  $('#wrapper').on('click', '.operation-img', toggelOperation)
  $('#wrapper').on('click', '.panel-title', toggelPanelClass)
  $('#wrapper').on('click', '.menu-item li', doHandler)
  //新增对象表格行
  $('#wrapper').on('click', '.add-object-key', addRecords)

  //删除集合表格表头key
  $('#wrapper').on('click', '.header-key-del', deleteArrKeys)
  //显示内容
  $('#wrapper').on('mouseover', '.header-key', showDelElement)
  $('#wrapper').on('mouseout', '.header-key', showDelElement)
  //删除面板
  $('#wrapper').on('click', '.panel-del', deletePanel)
  //td右键菜单
  $('#wrapper').on('contextmenu', 'td', showtdTypeMenu)
  //数组 对象 key修改同步修改关联的panel-title、td的值
  $('#wrapper').on('blur', '.associated-item', changeAssocatedPre)
  //对象的td 改变同步panel的title
  $('#wrapper').on('blur', 'td', changeAssocatedNext)
  // $("#wrapper").on('input','[contenteditable="true"]',function(){

  // })

  $('#contextmenuItem').on('click', function () {
    layer.open({
      type: 1,
      title: '请选择类型',
      closeBtn: 0,
      area: ['auto'],
      //   skin: 'layui-layer-nobg', //没有背景色
      shadeClose: true,
      btn: ['确定', '取消'],
      content: $('#typeElement'),
      yes: function () {
        let type = $('[name="type"]:checked').val()
        changeTdDataType(type)
      },
    })
  })

  $(document).on('click', function (event) {
    if ($(event.target).closest('.operation-img').length === 0) {
      $('.menu-item').addClass('panel-table-active')
    }
    document.getElementById('contextmenuItem').style.cssText = 'display:none'
  })
  //初始化表单
  layui.use(['form'], function () {
    var form = layui.form
  })
}
//修改关联的key值
function changeAssocated(nodeDirection, self, event) {
  let value = removeSpecialSymbols(self.innerHTML),
    parentTdNode = self
  while (parentTdNode.nodeName !== 'TD') {
    parentTdNode = parentTdNode.parentNode
  }
  let previousSiblingEle = parentTdNode[nodeDirection]
  while (previousSiblingEle.nodeName !== 'TD') {
    previousSiblingEle = previousSiblingEle[nodeDirection]
  }
  //赋值给title
  nodeDirection === 'nextSibling' && (previousSiblingEle = previousSiblingEle.querySelector('.associated-item'))
  previousSiblingEle.innerHTML = value

  event.stopPropagation()
  event.preventDefault()
}

//改变 title key值 同步key
function changeAssocatedPre(event) {
  //当前为panel为json 同步上一个td值； panel为数组 同步当前列的title
  let parentTdNode = this.parentNode
  event.target.innerHTML = removeSpecialSymbols(event.target.innerHTML)
  while (parentTdNode.nodeName !== 'TD') {
    parentTdNode = parentTdNode.parentNode
  }
  //找到外层panel类型
  const { container } = getContainer(parentTdNode),
    type = container.querySelector('.panel-title').dataset.type
  if (type === 'json') changeAssocated('previousSibling', this, event)
  else if (type === 'array') changeTableTheadValues(parentTdNode, this)
  event.stopPropagation()
  event.preventDefault()
}
function placeCaretAtEnd(el) {
  //传入光标要去的jq节点对象
  el.focus()
  if (typeof window.getSelection != 'undefined' && typeof document.createRange != 'undefined') {
    var range = document.createRange()
    range.selectNodeContents(el)
    range.collapse(false)
    var sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)
  } else if (typeof document.body.createTextRange != 'undefined') {
    var textRange = document.body.createTextRange()
    textRange.moveToElementText(el)
    textRange.collapse(false)
    textRange.select()
  }
}
//改变表格 表头列的值
function changeTableTheadValues(parentTdNode, self) {
  return
  //单元格索引
  const cellIndex = parentTdNode.cellIndex
  let tableElement = parentTdNode.parentNode
  while (tableElement.nodeName !== 'TABLE') {
    tableElement = tableElement.parentNode
  }
  const theadElement = tableElement.querySelector('thead').querySelector('tr')
  //表头的key放置在  class 为 key的span中
  let currentAssociatedTh = theadElement.children[cellIndex].querySelector('.key'),
    value = removeSpecialSymbols(self.innerHTML)
  currentAssociatedTh && (currentAssociatedTh.innerHTML = value)
  //改变当前表格同列下的panel的值
  // changeTableAllArrayPanelKey(tableElement.querySelector('tbody'), cellIndex, value)
}
//改变所有数组类型表格下的 panel值
function changeTableAllArrayPanelKey(tbodyElement, cellIndex, value) {
  const { container } = getContainer(tbodyElement)
  let xmlData = getTableData(container)
  console.log(JSON.stringify(xmlData))
  const result = x2jsone.json2xml(xmlData)
  //重新渲染当前的表格数据
  console.log(result)
  let newHtml = getPanel(xmlData) //renderRoot([xmlData])
  container.parentNode.innerHTML = newHtml
  return
  let trNodes = tbodyElement.querySelector('tr')
  while (trNodes && trNodes.nodeName === 'TR') {
    let containerElement = trNodes.children[cellIndex].querySelector('.container')
    if (containerElement) {
      containerElement.querySelector('.associated-item').innerHTML = value
      trNodes = trNodes.nextSibling
    }
  }
}
//改变td值 同步 key
function changeAssocatedNext(event) {
  if (event.target.nodeName !== 'TD') return
  //所有td数组的值
  event.target.innerHTML = removeSpecialSymbols(event.target.innerHTML)
  //当前panel 为json 执行
  const { container } = getContainer(this),
    type = container.querySelector('.panel-title').dataset.type
  //当前panel为 json 并且下一个单元格为 panel执行
  if (type === 'json' && currentTdNextTdNodeType(this.nextSibling)) changeAssocated('nextSibling', this, event)
  event.stopPropagation()
  event.preventDefault()
}
//下一个 td 是否为panel
function currentTdNextTdNodeType(nextNode) {
  while (nextNode && nextNode.nodeName !== 'TD') {
    nextNode = nextNode.nextSibling
  }

  return nextNode && nextNode.querySelector('.container')
}

//修改td类型
function changeTdDataType(type) {
  let innerHTMLDom = '',
    key = getKeys(),
    values = []
  switch (type) {
    case 'string':
      innerHTMLDom = 'values'
      break
    case 'array':
      innerHTMLDom = `<div class="container">${getArrTitleElementPre(key, values)} ${getTable([{ key: key }])}</div>` // renderTable(['1', ['']])
      break
    case 'json':
      innerHTMLDom = getTdObjectelement()
      break
  }
  contextMenuElement.innerHTML = innerHTMLDom
  contextMenuElement.setAttribute('contenteditable', type === 'string')
}
//获取单元格对象DOM
function getTdObjectelement() {
  let keyDom = contextMenuElement.previousSibling
  while (keyDom.nodeName !== 'TD') {
    keyDom = keyDom.previousSibling
  }
  let key = removeSpecialSymbols(keyDom.innerHTML)
  return getObjectTitleElement(key, { [key]: { key: 'values' } })
}

function showtdTypeMenu(event) {
  //当前表格类型
  const { container } = getContainer(this),
    type = container.querySelector('.panel-title').dataset.type,
    cellIndex = this.cellIndex,
    currentRect = this.getBoundingClientRect()

  if ((type === 'json' && cellIndex > 1) || (type === 'array' && cellIndex > 0)) {
    contextMenuElement = this
    document.querySelector('#contextmenuItem').style.cssText = `display:block;top:${event.pageY}px;left:${event.pageX}px`
  } else {
    console.log('不可更改类型')
  }
  event.stopPropagation()
  event.preventDefault()
}
//删除panel
function deletePanel(event) {
  console.log('======')
  let parentNode = this.parentNode
  handlerDelPanel(parentNode)
  //弹窗提示框 选择新的内容为那种模式

  event.stopPropagation()
}
function handlerDelPanel(parentNode) {
  while (!parentNode.classList.contains('container')) {
    parentNode = parentNode.parentNode
  }
  let tdElement = parentNode
  //当前单元格可编辑
  while (tdElement.nodeName !== 'TD') {
    tdElement = tdElement.parentNode
  }
  tdElement.setAttribute('contenteditable', true)
  parentNode.remove()
}

function showDelElement() {
  $(this).children('.header-key-del').toggleClass('header-key-del-ative')
}
//删除集合表格表头key（删除列）
function deleteArrKeys() {
  // table.rows[i].deleteCell(index)
  const parentNode = $(this).parents('th')[0],
    cellIndex = parentNode.cellIndex
  let tableElement = this.parentNode
  // if ($(this).parents('tr').children('th').length === 2) {
  //   console.log('至少一列')
  //   alert('至少保留一列')
  //   return
  // }
  while (tableElement.nodeName !== 'TABLE') {
    tableElement = tableElement.parentNode
  }
  let trNode = tableElement.querySelector('tbody').querySelector('tr')
  while (trNode && trNode.nodeName === 'TR') {
    trNode.deleteCell(cellIndex)
    trNode = trNode.nextSibling
  }
  const parentNodeTr = parentNode.parentNode
  parentNode.remove()
  //如果没有只有一列 移除panel
  removePanelByJson(parentNodeTr)
}
//移除panel
function removePanelByJson(parentNodeTr) {
  //如果当前表头只有一类 进行移除
  if (parentNodeTr.children.length === 1) {
    // let { container } = getContainer(trNode)
    handlerDelPanel(parentNodeTr)
  }
}
//新增对象表格行
function addOjectKey(event, parentNode) {
  let { container } = getContainer(parentNode)

  const trNode = container.querySelector('tr').cloneNode(true),
    allTd = trNode.querySelectorAll('td')
  //第一列为操作列
  for (let index = 1; index < allTd.length; index++) {
    const element = allTd[index]
    element.innerHTML = getKeys()
  }
  container.querySelector('tbody').appendChild(trNode)
  //统计key数量
  statisticsNumber(container)
}
//新增集合列
function addArrColumns(event, parentNode) {
  const { container } = getContainer(parentNode),
    thKey = getArrayTableHeaderOperationElement(getKeys()) //
  // thEle.setAttribute('contenteditable', true)
  //所有统计表格
  const allChildrenNodes = container.children
  for (let index = 0; index < allChildrenNodes.length; index++) {
    const element = allChildrenNodes[index]
    if (element.nodeName === 'TABLE') {
      let thEle = document.createElement('TH')
      thEle.innerHTML = thKey

      const headerTr = element.querySelector('tr')
      headerTr.appendChild(thEle)
      //所有行添加列
      let tbodyTrEle = element.querySelector('tbody').querySelector('tr')
      while (tbodyTrEle) {
        let columns = tbodyTrEle.insertCell()
        columns.setAttribute('contenteditable', true)
        columns.innerHTML = 'values'
        tbodyTrEle = tbodyTrEle.nextSibling
      }
    }
  }
  // const headerTr = container.querySelector('table').querySelector('tr')
  // headerTr.appendChild(thEle)
  // //所有行添加列
  // let tbodyTrEle = container.querySelector('table').querySelector('tbody').querySelector('tr')
  // while (tbodyTrEle) {
  //   let columns = tbodyTrEle.insertCell()
  //   columns.setAttribute('contenteditable', true)
  //   columns.innerHTML='values'
  //   tbodyTrEle = tbodyTrEle.nextSibling
  // }
}
function getKeys() {
  return 'K' + Math.random().toString(36).substr(2, 4)
}
//添加记录
function addRecords(event) {
  const type = this.dataset.type,
    parentNode = this.parentNode
  type === 'json' ? addOjectKey(event, parentNode) : addArrColumns(event, parentNode)
  event.stopPropagation()
}

function statisticsNumber(container, type = 'add') {
  const countElement = container.querySelector('.count')
  let diffNumber = type === 'subtraction' ? -1 : 1
  countElement.innerHTML = +countElement.innerHTML + diffNumber
}
function readerFile() {
  const selFile = document.getElementById('file').files
  if (selFile.length) {
    const files = selFile[0],
      reader = new FileReader() //new一个FileReader实例
    if (files.type !== 'text/xml') {
      console.log('请选择xml')
      return
    }
    //文件读取成功
    reader.onload = function () {
      //xml转json
      console.log(this.result)
      const result = x2jsone.xml_str2json(this.result)
      if (!result) {
        alert('xml格式错误!')
        return
      }
      let readData = renderRoot(result)
      document.getElementById('wrapper').innerHTML = readData
      document.getElementById('file').value = null
    }
    reader.readAsText(files)
  }
}
function renaderJson(n) {
  let xmlData = n.substr(n.indexOf('>') + 1)

  let jsonObj = $.xml2json(xmlstr)
  console.log(jsonObj)
}
//执行操作
function doHandler(event) {
  //操作类型
  const targetElement = event.target
  const type = targetElement.dataset.type
  //影藏弹窗
  $(this).parent('.menu-item').toggleClass('panel-table-active')
  //删除判断是否为最后一行

  console.log($($(this).parents('table')[0]).siblings('table').length)

  // getCurrentPanelTrData($(this).parents('.container')[0])
  // if (['delJson', 'delete'].includes(type) && $($(this).parents('tbody')[0]).children('tr').length === 1) {
  //   console.log('至少保留一行')
  //   alert('至少保留一行')
  //   return
  // }

  switch (type) {
    case 'copy':
      copyArrRows(targetElement)
      break
    case 'copyJson':
      copyObjectRows(targetElement)
      break
    case 'delete':
      deleteArrRows(targetElement)
      break
    case 'delJson':
      deleteObjectRows(targetElement)
      break
  }
  event.stopPropagation()
  event.preventDefault()
}

//复制行
function copyRows(targetElement) {
  let parentNodeTr = targetElement
  while (parentNodeTr.nodeName !== 'TR') {
    parentNodeTr = parentNodeTr.parentNode
  }
  //当前行element
  const copyNodes = parentNodeTr.cloneNode(true)
  parentNodeTr.parentNode.appendChild(copyNodes)
  return { parentNodeTr, copyNodes }

  // const rowData=parentNodeTr
}
//复制集合行
function copyArrRows(targetElement) {
  const { parentNodeTr, copyNodes } = copyRows(targetElement)
  //修改编号
  const serialNumber = parentNodeTr.parentNode.children.length
  copyNodes.children[0].innerHTML = getTblRowOperationElement(serialNumber)
  let { container } = getContainer(parentNodeTr)
  statisticsNumber(container)
  //表格排序 包含同辈表格
  sortTableRows(container)
}
//复制对象行
function copyObjectRows(targetElement) {
  const { parentNodeTr, copyNodes } = copyRows(targetElement)
  // let container = parentNodeTr
  // //统计数量
  // while (!container.classList.contains('container')) {
  //   container = container.parentNode
  // }
  let { container } = getContainer(parentNodeTr)
  statisticsNumber(container)
}
//删除行
function deleteRows(targetElement) {
  let parentNodeTr = targetElement
  while (parentNodeTr.nodeName !== 'TR') {
    parentNodeTr = parentNodeTr.parentNode
  }
  const parentNode = parentNodeTr.parentNode
  //移除当前的行
  parentNodeTr.remove()
  return { parentNode }
}
//删除对象行
function deleteObjectRows(targetElement) {
  const { parentNode } = deleteRows(targetElement)
  if (parentNode.children.length === 0) {
    handlerDelPanel(parentNode)
    return
  }
  //修改当前行数
  let { container } = getContainer(parentNode)
  statisticsNumber(container, 'subtraction')
  //  countElement.innerHTML = +countElement.innerHTML + 1
}
function getContainer(parentNodeTr) {
  let container = parentNodeTr
  //统计数量
  while (!container.classList.contains('container')) {
    container = container.parentNode
  }
  return { container }
}
function deleteArrRows(targetElement) {
  const { parentNode } = deleteRows(targetElement)
  //表格序号排序
  sortTableRows(parentNode)
  //如果行删除完将panel移除
  if (parentNode.children.length === 0) {
    // handlerDelPanel(parentNode)
    deleteArrPanel(parentNode)
    return
  }
  let { container } = getContainer(parentNode)
  statisticsNumber(container, 'subtraction')
}
/**
 * 删除表格panel 判断统计表格数
 * @param {*} parentNode tr DOM
 */
function deleteArrPanel(parentNode) {
  //如果同级含有表格 只移除当前表格
  const { container } = getContainer(parentNode),
    allChildrenNodes = container.children
  let childrenNodeName = []
  for (let index = 0; index < allChildrenNodes.length; index++) {
    const nodeName = allChildrenNodes[index].nodeName
    if (nodeName === 'TABLE') childrenNodeName.push(nodeName)
  }
  //没有统计表格删除 panel 否则删除当前table
  childrenNodeName.length === 1 ? handlerDelPanel(container) : deleteTabelElement(parentNode)
}
/**
 * 删除 表格DOM
 * @param {*} trNode
 */
function deleteTabelElement(trNode) {
  let tableElement = trNode.parentNode
  const { container } = getContainer(trNode)
  while (tableElement.nodeName !== 'TABLE') {
    tableElement = tableElement.parentNode
  }
  tableElement.remove()
  //统计集合数量
  statisticsNumber(container, 'subtraction')
}
//获取当前panel下的表格行数 container
function getCurrentPanelTrData(parentNode) {
  const allChildren = parentNode.children
  let allTrAmount = 0
  for (let index = 0; index < allChildren.length; index++) {
    const element = allChildren[index]
    if (element.nodeName === 'TABLE') {
      allTrAmount += element.querySelector('tbody').children.length
    }
  }
  console.log(allTrAmount)
}
/**
 * 表格行排序,包含统计表格
 * @param {*} tablElement tbody Dom
 */
function sortTableRows(tablElement) {
  // let parentNodeTr = tablElement.querySelector('tr'),
  //   index = 1
  const { container } = getContainer(tablElement),
    allChildren = container.children
  let tableIndex = 1
  for (let index = 0; index < allChildren.length; index++) {
    const element = allChildren[index]
    if (element.nodeName === 'TABLE') {
      let parentNodeTr = element.querySelector('tbody').querySelector('tr')
      while (parentNodeTr) {
        parentNodeTr.querySelector('.serial').innerHTML = tableIndex
        tableIndex++
        parentNodeTr = parentNodeTr.nextSibling
      }
    }
  }
}

//设置操作菜单状态
function toggelOperation() {
  $('.menu-item').not($(this)).addClass('panel-table-active')
  $(this).children('.menu-item').toggleClass('panel-table-active')
  // const opElement = this.querySelector('.menu-item'),
  //   OpClassList = opElement.classList
  // if (OpClassList.contains('panel-table-active')) {
  //   OpClassList.remove('panel-table-active')
  // } else {
  //   OpClassList.add('panel-table-active')
  // }
}
//折叠表格
function toggelPanelClass(event) {
  if (event.target.nodeName === 'SPAN') return
  // const collapseImgElement = this.querySelector('.collapse-img'),
  //   classList = collapseImgElement.classList,
  //   tableElement = this.nextSibling
  // if (classList.contains('panel-title-active')) {
  //   classList.remove('panel-title-active')
  // } else {
  //   classList.add('panel-title-active')
  // }

  $(this).toggleClass('panel-title-active')
  $(this).find('.collapse-img').toggleClass('panel-title-active')
  //表格
  const tableElement = this.nextSibling
  toggleTableState(tableElement)
}
function toggleTableState(tableElement) {
  while (tableElement) {
    if (tableElement.nodeName === 'TABLE') {
      const tablePanelClassList = tableElement.classList
      if (tablePanelClassList.contains('panel-table-active')) {
        tablePanelClassList.remove('panel-table-active')
      } else {
        tablePanelClassList.add('panel-table-active')
      }
    }
    tableElement = tableElement.nextSibling
  }
}

function renderRoot(data) {
  let key = Object.keys(data),
    valuesData = Object.values(data[key])
  let panelElement = `<div class="panel container"> <header class='panel-title' data-type="json"> <img src="images/collapse.png" class='collapse-img'/> <span contenteditable="true">${key}</span>:{<span class='count'>${valuesData.length}</span>}<div class="add-object-key" data-type='json'></div></header>`
  //渲染子级
  panelElement += getJsonElement(data[key])
  // panelElement += renderTable([data[key]])

  // for (const item in data[key]) {
  //   panelElement += `<div class="panel container">${renderTable([data[key][item]])}</div>`
  // }
  panelElement += ' </div>'
  return panelElement
}

//渲染表格
function renderTable(data) {
  let ele = ''
  for (const item of data) {
    //新的表格
    if (Array.isArray(item)) {
      //修改将数据按照相同列分组
      // let groupColumnData = groupByColumn(item)
      ele += getGroupTableElement(item)
      // ele += '</div>'
    } else if (typeof item === 'object' && Object.keys(item).length > 0) {
      //加载面板
      ele += getTable([item]) // getGroupTableElement([item]) //getPanel(item)
    }
  }
  return ele
}
//子级按照列分组
function groupByColumn(data) {
  let groupData = {}
  for (const item of data) {
    //当前key
    let keys = Object.keys(item)
    //已经分组key集合
    const existKey = Object.keys(groupData)
    let hasExist = existKey.find(v => {
      const currentKey = v.split(',')
      return currentKey.length === keys.length && keys.every(vv => currentKey.some(vvv => vvv === vv))
    })

    let key = hasExist
    if (!hasExist) {
      key = keys.join(',')
      groupData[key] = []
    }
    groupData[key].push(item)
  }
  return Object.values(groupData)
}
function getPanel(data) {
  let panelElement = ``
  let valuesData = Object.values(data)
  let keysData = Object.keys(data)
  for (const item of keysData) {
    // let valuesDataC = Object.values(data[item])
    panelElement += `<div class="panel "> <p class='panel-title' data-type="array"> <img src="images/collapse.png" class='collapse-img'/> <span contenteditable="true">${item}</span>:[${valuesData.flat(Infinity).length}]</p>`
    //渲染子级
    if (Array.isArray(data[item])) {
      for (const childrenItem of valuesData) {
        panelElement += renderTable([childrenItem])
      }
    } else {
      const childrenKeys = Object.keys(data[item])
      for (const childrenItem of childrenKeys) {
        panelElement += renderTable([{ [childrenItem]: data[item][childrenItem] }])
      }
    }

    panelElement += '</div>'
  }
  return panelElement
}
//获取表格
function getTable(tblData, tblIndex = 0) {
  const groupData = groupByColumn(tblData)
  let tableElement = ''
  for (let j = 0; j < groupData.length; j++) {
    const data = groupData[j]
    tableElement += '<table class="groupTbl"> <thead><tr>  <th><div class="serial-number"></div>  </th>'
    let headerKeysData = Array.isArray(data) ? data[0] : data,
      headerData = Object.keys(headerKeysData)
    for (const item of headerData) {
      tableElement += `<th>${getArrayTableHeaderOperationElement(item)}</th>`
    }
    tableElement += '</tr></thead><tbody>'
    for (let index = 0; index < data.length; index++) {
      const element = data[index]
      tblIndex++
      tableElement += `<tr ><td>${getTblRowOperationElement(tblIndex)}</td>${getTableTdContainer(element)}</tr>`
    }
    tableElement += '</tbody></table>'
  }
  return tableElement
}
//获取集合表头操作dom
function getArrayTableHeaderOperationElement(item) {
  return `<div class='header-key'><span contenteditable="true" class='key'>${item}</span> <div class='header-key-del header-key-del-hide'><div></div>`
}
//获取表格行操作
function getTblRowOperationElement(index, copy = 'copy', del = 'delete') {
  return `<span class='serial'>${index}</span><div class="table-serial"><div class="operation-img"><ul class="menu-item panel-table-active"><li data-type='${copy}'>复制</li><li data-type='${del}'>删除</li></ul></div></div> `
}

function getTableTdContainer(data, index) {
  let ele = ``
  for (const key in data) {
    const value = data[key]
    //字符串
    if (typeof value !== 'object') {
      ele += `<td contenteditable="true">${value}</td>`
    } else if (Array.isArray(value)) {
      //数据进行分组
      // let groupColumnData = groupByColumn(value)
      // ele += `<td><div class="container"> <header class="panel-title"  data-type="array"><img src="images/collapse.png" class='collapse-img'/> <span contenteditable="true">${key}</span>[<span class='count'>${value.length}</span>]</header>`
      ele += `<td><div class="container">`
      ele += getArrTitleElementPre(key, value)
      ele += getGroupTableElement(value)
      ele += '</div></td>'
    } else {
      ele += `<td >${getObjectTitleElement(key, data)}</td>`
      //<div class="container"><p class='panel-title'  data-type="json"><img src="images/collapse.png" class='collapse-img'/>  <span contenteditable="true">${key}</span>{哈哈${Object.keys(value).length}}</p>${getJsonElement(value)}</div>
    }
  }
  return ele
}
function getGroupTableElement(data) {
  let groupColumnData = groupByColumn(data),
    tblIndex = 0,
    ele = ''
  for (const iterator of groupColumnData) {
    ele += getTable(iterator, tblIndex)
    tblIndex += iterator.length
  }
  return ele
}
function getJsonElement(data) {
  let ele = '<table class="embedded-table">',
    operationElement = getTblRowOperationElement('', 'copyJson', 'delJson')
  for (const key in data) {
    if (typeof data[key] !== 'object') ele += `<tr><td>${operationElement}</td> <td  contenteditable="true">${key}</td><td  contenteditable="true">${data[key]}</td></tr>`
    else if (Array.isArray(data[key])) {
      let tblData = Array.isArray(data[key]) ? data[key] : [data[key]]
      ele += `<tr><td>${operationElement}</td>${getArrTitleElement(key, tblData)} </div></td> </tr>` //`<tr><td>${key}</td><td>${data[key]}</td></tr>`
    } else {
      ele += `<tr><td>${operationElement}</td> <td contenteditable="true">${key} </td> <td>${getObjectTitleElement(key, data)} </td</tr>`
    }
  }
  ele += '</table>'
  return ele
}
//集合数量 title dom
function getArrTitleElement(key, tblData) {
  //针对为字符串类型的数组 转为json格式
  typeof tblData[0] === 'string' && (tblData = tblData.map(v => ({ [key]: v })))
  return `<td contenteditable="true">${key}</td><td> <div class="container"> ${getArrTitleElementPre(key, tblData)}${getTable(tblData)}` //</div></td>
}
//获取集合 标题DOM
function getArrTitleElementPre(key, tblData) {
  return `<header class='panel-title'  data-type="array"><img src="images/collapse.png" class='collapse-img'/> <span contenteditable="true" class='key-item associated-item'>${key}</span>[<span class='count'>${tblData.length}</span>]<div class="add-object-key" data-type='array'></div>  <div class="panel-del"></div></header>`
}

//获取对象标题
function getObjectTitleElement(key, data) {
  return `<div class="container"><header class='panel-title'  data-type="json"><img src="images/collapse.png" class='collapse-img'/>  <span contenteditable="true" class='key-item associated-item'>${key}</span>  {<span class='count'>${Object.keys(data[key]).length}</span>} <div class='add-object-key' data-type='json'></div>  <div class="panel-del"></div> </header>   ${getJsonElement(data[key])}</div>`
}
//输出更改之后的数据集
function TableToJson() {
  const container = document.getElementById('wrapper'),
    xmlData = getTableData(container)
  console.log(JSON.stringify(xmlData))

  const result = x2jsone.json2xml(xmlData)
  console.log(result)
}
//遍历所有的节点
function getTableData(parentNode) {
  //找到第一个节点
  const childrenList = parentNode.querySelector('.panel-title'),
    tagType = childrenList.dataset.type

  let tagKey = removeSpecialSymbols(childrenList.querySelector('span').innerHTML)
  tagKey = keyFirstChatNotNumber(tagKey)
  let xmlJson = {}
  //节点类型
  xmlJson[tagKey] = tagType === 'array' ? [] : {}
  //获取表格数据
  xmlJson[tagKey] = getTagData(tagType, childrenList.parentNode)
  return xmlJson
}
//获取标签下的表格数据
function getTagData(type, parentNode) {
  return type === 'array' ? getArrayXmlData(parentNode) : getJsonXmlData(parentNode)
}
/**
 * json类型表格数据
 * 行第一列为key
 */
function getJsonXmlData(parentNode) {
  const tableElement = parentNode.querySelector('table')
  let trData = tableElement.querySelector('tr'),
    xmlData = {}
  while (trData) {
    if (trData.nodeName === 'TR') {
      const tdData = trData.children
      let key = removeSpecialSymbols(tdData[1].innerHTML)
      key = keyFirstChatNotNumber(key)
      let values = null
      //值 需要判断类型
      if (tdData[2].children.length > 0) {
        values = getTableData(tdData[2]) // Object.values()
        // xmlData[key] = values
        xmlData = Object.assign(xmlData, values)
      } else {
        xmlData[key] = removeSpecialSymbols(tdData[2].innerHTML) // tdData[1].innerHTML.trim().replace(/[\r\n]/g,'')
        // xmlData[key] = values
      }
    }
    trData = trData.nextSibling
  }
  return xmlData
}
//数组类型表格数据
function getArrayXmlData(parentNode) {
  //表格element
  let xmlData = parentNode.querySelector('table'),
    //当前表格数组集合
    xmlArrayData = []
  while (xmlData && xmlData.nodeName === 'TABLE') {
    //数组对象 key
    let objectKeys = xmlData.querySelector('thead').querySelectorAll('th'),
      allKeysData = []
    //表头列名称
    objectKeys.forEach((item, index) => {
      const key = item.querySelector('.key')
      allKeysData.push(removeSpecialSymbols(key?.innerHTML))
    })
    let trData = xmlData.querySelector('tbody').querySelector('tr')

    while (trData && trData.nodeName === 'TR') {
      let tdData = trData.children,
        tdJson = {}
      for (let index = 1; index < tdData.length; index++) {
        const item = tdData[index]
        //值 需要判断类型
        if (item.children.length > 0) {
          tdJson = Object.assign(tdJson, getTableData(item))
        } else {
          let curKey = keyFirstChatNotNumber(allKeysData[index])
          tdJson[curKey] = removeSpecialSymbols(item.innerHTML)
        }
      }
      xmlArrayData.push(tdJson)
      trData = trData.nextSibling
    }
    xmlData = xmlData.nextSibling
  }
  return xmlArrayData
}

function keyFirstChatNotNumber(key) {
  let firstChart = key.charAt(0)
  !isNaN(firstChart) && (key = 'key' + key)
  return key
}
//去除换行等特殊字符
function removeSpecialSymbols(value = '') {
  return value
    .trim()
    .replace(/[&\|\\\*^%$ #@\-]/g, '')
    .replace(/\<br\>|&nbsp;|[^a-zA-z0-9\u4e00-\u9fa5\r\n^\w^\s^]/g, '') //replace(/[\/r\/n\/<br\/> &nsp;]/g, '')
}
