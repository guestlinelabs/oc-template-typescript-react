"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useData = exports.DataProvider = void 0;
const react_1 = __importDefault(require("react"));
const DataContext = react_1.default.createContext({});
const DataProvider = ({ children, ...props }) => {
    return react_1.default.createElement(DataContext.Provider, { value: props }, children);
};
exports.DataProvider = DataProvider;
function useData() {
    const { value: { getData, ...rest } } = react_1.default.useContext(DataContext);
    const asyncGetData = react_1.default.useCallback((data) => {
        return new Promise((resolve, reject) => {
            // @ts-ignore
            getData({ ...rest, ...data }, (err, newData) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(newData);
                }
            });
        });
    }, []);
    // @ts-ignore
    return { getData: asyncGetData, ...rest };
}
exports.useData = useData;
