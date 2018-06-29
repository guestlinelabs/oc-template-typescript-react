import React from "react";

const withSettingProvider = (BaseComponent: any) => {
  const Enhanced = (props: any, context: any) => {
    const propsWithGetSetting = {
      ...props,
      getSetting: context.getSetting
    };

    return <BaseComponent {...propsWithGetSetting} />;
  };

  return Enhanced;
};

export default withSettingProvider;
