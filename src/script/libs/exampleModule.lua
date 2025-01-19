local printModule = include("libs/superComplexPrintModule.lua")

return {
    test = function()
        printModule.print(getVar("NAME"))
        printModule.print(getVar("VERSION"))
        printModule.print(getVar("RELEASE"))
    end
}