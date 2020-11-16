import React from 'react';

const withDataProvider = (BaseComponent: any) => {
  const Enhanced = (props: any, context: any) => {
    const propsWithGetData = {
      ...props,
      getData: context.getData
    };

    return <BaseComponent {...propsWithGetData} />;
  };

  return Enhanced;
};

export default withDataProvider;
