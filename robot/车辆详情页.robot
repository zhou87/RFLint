*** Settings ***
  

*** Keywords ***
登录弹个车C端-Pass
    ${list}=  Create List     1  2  3
    :FOR  ${element}  IN  @{list}
      Log  ${element}
    Run Keyword If  '${list[0]}'=='1'   Log   False

获取一个随机数
    Log   随机数

*** Test Case ***
这是一个case
    登录弹个车C端-Pass  
    ${carId}=  Set Variable   12
    Run Keyword If   ${carId}=='12'  Log   ${carId}

获取一个随机数
    Log   随机数+Test Case
    ${list}     获取单个金融产品信息（二手车）-Api                      ${params}
    ${result}                      app获取车辆信息-Api                                                    ${app获取车辆信息-params}
    ${result}                      基本信息及配置-Api                                                      ${params}
    Log                            ${result}
    ${carStatus}                   Set Variable If
    ...                            '${result['data']['carStatus']}'=='退库'                           已退库
    ...                            '${flag1}'!='FAIL'                                               ${result['data']['tgc']['text1']}
    ...                            '${flag2}'!='FAIL' and '${result['data']['carStatus']}'=='在售'    不准入
    ...                            '${flag2}'!='FAIL' and '${result['data']['carStatus']}'=='已售'    已售
    ...                            '${flag1}'=='FAIL' and '${flag2}'=='FAIL'                        已设置
    ${dubboNum}                    根据搜索条件获取dubbo接口的车辆数num           ${type}                                                                                                                                ${dubboSearchParam}
    ${apiNum}                      根据搜索条件获取搜索api接口的车辆数num           ${type}   


*** Variable ***
${params}=
...       name=zhp
