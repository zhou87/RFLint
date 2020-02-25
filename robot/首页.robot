*** Settings ***
Resource         ${EXECDIR}/robot/车辆详情页.robot
Test Setup  Log  test setup


*** Keywords ***
test-Pass
    @{list}   Create List   1  2  3
    :FOR  ${element}  IN  @{list}
      Should Not Be Empty  ${element}
    Log         ${list}
    Run Keyword If  '${list[0]}'=='1'
    ...      Log  test 
    