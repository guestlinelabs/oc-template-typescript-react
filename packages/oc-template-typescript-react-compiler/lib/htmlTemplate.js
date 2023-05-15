const viewTemplate = ({ templateId, css, externals, bundle, hash }) => `function(model){
  oc.reactComponents = oc.reactComponents || {};
  oc.reactComponents['${hash}'] = oc.reactComponents['${hash}'] || (${bundle});
  if (!model) return;
  var modelHTML =  model.__html ? model.__html : '';
  var staticPath = model.reactComponent.props._staticPath;
  var props = JSON.stringify(model.reactComponent.props);
  oc = oc || {};
  oc.__typescriptReactTemplate = oc.__typescriptReactTemplate || { count: 0 };
  var count = oc.__typescriptReactTemplate.count;
  var templateId = "${templateId}-" + count;
  oc.__typescriptReactTemplate.count++;
  return '<div id="' + templateId + '" class="${templateId}">' + modelHTML + '</div>' +
    '${css ? '<style>' + css + '</style>' : ''}' +
    '<script>' +
    'oc = oc || {};' +
    'oc.cmd = oc.cmd || [];' +
    'oc.cmd.push(function(oc){' +
    '${css ? "oc.events.fire(\\'oc:cssDidMount\\', \\'" + css + "\\');" : ''}' +
      'oc.requireSeries(${JSON.stringify(externals)}, function(){' +
        'var targetNode = document.getElementById("' + templateId + '");' +
        'targetNode.setAttribute("id","");' +
        'var reactElement = React.createElement(oc.reactComponents["${hash}"],' +  props + ');' +
        'if (ReactDOM.createRoot) {' +
          'if (' + !!modelHTML  + ') {' + 
            'var root = ReactDOM.hydrateRoot(targetNode, reactElement);' +
            'root.render(reactElement);' +
          '} else {' +
            'var root = ReactDOM.createRoot(targetNode);' +
            'root.render(reactElement);' +
          '}' +
        '} else {' +
          'if (' + !!modelHTML  + ') {' + 
            'ReactDOM.hydrate(reactElement, targetNode);' +
          '} else {' +
            'ReactDOM.render(reactElement, targetNode);' +
          '}' +
        '}' +
      '});' +
    '});' +
  '</script>'
}`;

module.exports = viewTemplate;
