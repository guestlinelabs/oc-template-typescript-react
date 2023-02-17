const viewTemplate = ({ reactRoot, css, externals, bundleHash, bundleName }) => `function(model){
  var modelHTML =  model.__html ? model.__html : '';
  var staticPath = model.reactComponent.props._staticPath;
  var props = JSON.stringify(model.reactComponent.props);
  window.oc = window.oc || {};
  window.oc.__typescriptReactTemplate = window.oc.__typescriptReactTemplate || { count: 0 };
  var count = window.oc.__typescriptReactTemplate.count;
  var templateId = "${reactRoot}-" + count;
  window.oc.__typescriptReactTemplate.count++;
  return '<div id="' + templateId + '" class="${reactRoot}">' + modelHTML + '</div>' +
    '${css ? '<style>' + css + '</style>' : ''}' +
    '<script>' +
    'window.oc = window.oc || {};' +
    'oc.cmd = oc.cmd || [];' +
    'oc.cmd.push(function(oc){' +
    '${css ? "oc.events.fire(\\'oc:cssDidMount\\', \\'" + css + "\\');" : ''}' +
      'oc.requireSeries(${JSON.stringify(externals)}, function(){' +
        'oc.require(' +
          '["oc", "reactComponents", "${bundleHash}"],' + 
          '"' + staticPath + '${bundleName}.js",' +
          'function(ReactComponent){' +
            'var targetNode = document.getElementById("' + templateId + '");' +
            'targetNode.setAttribute("id","");' +
            'var reactElement = React.createElement(ReactComponent,' +  props + ');' +
            'if (ReactDOM.createRoot) {' +
              'var root = ReactDOM.createRoot(targetNode);' +
              'root.render(reactElement);' +
            '} else {' +
              'ReactDOM.render(reactElement, targetNode);' +
            '}' +
          '}' +
        ');' +
      '});' +
    '});' +
  '</script>'
}`;

module.exports = viewTemplate;
