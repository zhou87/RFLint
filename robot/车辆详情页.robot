*** Settings ***
Documentation  

*** Keywords ***
登录弹个车C端-Pass
    ${list}=  Create List     1  2  3
    :FOR  ${element}  IN  @{list}
    \  Log  ${element}
    Run Keyword If  '${list[0]}'=='1'   Log   False

获取一个随机数
    Log   随机数

*** Test Case ***
这是一个case
    登录弹个车C端-Pass  
    ${carId}=  Set Variable   12
    Run Keyword If   ${carId}=='12'  Log   ${carId}

获取一个随机数
    Log  随机数+Test Case

*** Variable ***
${params}=
...       name=zhp
