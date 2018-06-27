const reactOCProviderTemplate = ({ viewPath }) => `
  import React from 'react';
  import View from '${viewPath}';

  class OCProvider extends React.Component {
    componentDidMount(){
      const { _staticPath, _baseUrl, _componentName, _componentVersion, ...rest } = (this.props as any);
      (window as any).oc.events.fire('oc:componentDidMount',  rest);
    }

    getChildContext() {
      const getData = (parameters: any, cb: (error: any, parameters?: any, props?: any) => void) => {
        return (window as any).oc.getData({
          name: (this.props as any)._componentName,
          version: (this.props as any)._componentVersion,
          baseUrl: (this.props as any)._baseUrl,
          parameters
        }, (err: any, data: any) => {
          if (err) {
            return cb(err);
          }
          const { _staticPath, _baseUrl, _componentName, _componentVersion, ...rest } = (data.reactComponent.props as any); 
          cb(null, rest, data.reactComponent.props);
        });
      };
      const getSetting = (setting : string) => {
        const settingHash = {
          name: (this.props as any)._componentName,
          version: (this.props as any)._componentVersion,
          baseUrl: (this.props as any)._baseUrl,
          staticPath: (this.props as any)._staticPath
        };
        return (settingHash as any)[setting];
      };
      return { getData, getSetting };
    }

    render() {
      const { _staticPath, _baseUrl, _componentName, _componentVersion, ...rest } = (this.props as any);        
      return (
        <View {...rest} />
      );
    }
  }

  export default OCProvider
`;

module.exports = reactOCProviderTemplate;
