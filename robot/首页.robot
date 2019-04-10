*** Settings ***
Documentation   首页

*** Keywords ***

test-Pass
    @{list}   Create List   1  2  3
    :FOR  ${element}  IN  @{list}
    \  Should Not Be Empty  ${element}
    Log         ${list}


