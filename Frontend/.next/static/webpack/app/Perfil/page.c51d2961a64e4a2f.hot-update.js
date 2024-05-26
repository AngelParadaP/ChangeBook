"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
self["webpackHotUpdate_N_E"]("app/Perfil/page",{

/***/ "(app-pages-browser)/./app/Perfil/ModalReportar.tsx":
/*!**************************************!*\
  !*** ./app/Perfil/ModalReportar.tsx ***!
  \**************************************/
/***/ (function(module, __webpack_exports__, __webpack_require__) {

eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   ModalReportar: function() { return /* binding */ ModalReportar; }\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"(app-pages-browser)/./node_modules/next/dist/compiled/react/jsx-dev-runtime.js\");\n/* harmony import */ var axios__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! axios */ \"(app-pages-browser)/./node_modules/axios/lib/axios.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"(app-pages-browser)/./node_modules/next/dist/compiled/react/index.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var react_toastify__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react-toastify */ \"(app-pages-browser)/./node_modules/react-toastify/dist/react-toastify.esm.mjs\");\n/* harmony import */ var react_toastify_dist_ReactToastify_css__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react-toastify/dist/ReactToastify.css */ \"(app-pages-browser)/./node_modules/react-toastify/dist/ReactToastify.css\");\n/* __next_internal_client_entry_do_not_use__ ModalReportar auto */ \nvar _s = $RefreshSig$();\n\n\n\n\nconst ModalReportar = (param)=>{\n    let { codigo, onButtonClick } = param;\n    _s();\n    const [descripcion, setDescripcion] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(\"\");\n    const [message, setMessage] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(\"\");\n    const codigo_remitente = localStorage.getItem(\"codigoUsuario\");\n    const handleSubmit = async (e)=>{\n        e.preventDefault();\n        try {\n            const response = await axios__WEBPACK_IMPORTED_MODULE_4__[\"default\"].post(\"/api/report/to/\".concat(codigo), {\n                descripcion,\n                codigo_remitente\n            });\n            react_toastify__WEBPACK_IMPORTED_MODULE_2__.toast.success(\"Reporte enviado con exito\", {\n                autoClose: 1000,\n                hideProgressBar: true,\n                position: \"top-center\"\n            });\n            onButtonClick(); // Cerrar el modal al enviar\n        } catch (error) {\n            console.error(\"Error al enviar el formulario:\", error);\n            react_toastify__WEBPACK_IMPORTED_MODULE_2__.toast.error(\"Fallo de envio del reporte\", {\n                autoClose: 1000,\n                hideProgressBar: true,\n                position: \"top-center\"\n            });\n        }\n        console.log(message);\n    };\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n        children: [\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(react_toastify__WEBPACK_IMPORTED_MODULE_2__.ToastContainer, {}, void 0, false, {\n                fileName: \"/Users/angelparada/Desktop/CBook/ChangeBook/Frontend/app/Perfil/ModalReportar.tsx\",\n                lineNumber: 41,\n                columnNumber: 13\n            }, undefined),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                className: \"fixed top-0 left-0 w-screen h-screen z-10 bg-black opacity-30\"\n            }, void 0, false, {\n                fileName: \"/Users/angelparada/Desktop/CBook/ChangeBook/Frontend/app/Perfil/ModalReportar.tsx\",\n                lineNumber: 43,\n                columnNumber: 13\n            }, undefined),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                className: \"fixed top-0 left-0 w-screen h-screen z-10 backdrop-filter backdrop-blur-sm flex items-center justify-center\",\n                children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                    className: \"bg-white p-10 rounded-lg shadow-2xl w-full max-w-2xl\",\n                    children: [\n                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"form\", {\n                            onSubmit: handleSubmit,\n                            children: [\n                                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                                    className: \"mb-6\",\n                                    children: [\n                                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                                            className: \"flex items-center justify-between w-full mb-9\",\n                                            children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"label\", {\n                                                className: \"block text-gray-700 text-lg font-bold mb-2\",\n                                                children: \"Describe los hechos.\"\n                                            }, void 0, false, {\n                                                fileName: \"/Users/angelparada/Desktop/CBook/ChangeBook/Frontend/app/Perfil/ModalReportar.tsx\",\n                                                lineNumber: 53,\n                                                columnNumber: 33\n                                            }, undefined)\n                                        }, void 0, false, {\n                                            fileName: \"/Users/angelparada/Desktop/CBook/ChangeBook/Frontend/app/Perfil/ModalReportar.tsx\",\n                                            lineNumber: 52,\n                                            columnNumber: 29\n                                        }, undefined),\n                                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"textarea\", {\n                                            className: \"shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline\",\n                                            id: \"descripcion\",\n                                            rows: \"8\",\n                                            placeholder: \"Escribe tu descripci\\xf3n aqu\\xed\",\n                                            value: descripcion,\n                                            onChange: (e)=>setDescripcion(e.target.value)\n                                        }, void 0, false, {\n                                            fileName: \"/Users/angelparada/Desktop/CBook/ChangeBook/Frontend/app/Perfil/ModalReportar.tsx\",\n                                            lineNumber: 57,\n                                            columnNumber: 29\n                                        }, undefined)\n                                    ]\n                                }, void 0, true, {\n                                    fileName: \"/Users/angelparada/Desktop/CBook/ChangeBook/Frontend/app/Perfil/ModalReportar.tsx\",\n                                    lineNumber: 51,\n                                    columnNumber: 25\n                                }, undefined),\n                                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                                    className: \"flex items-center justify-center space-x-4\",\n                                    children: [\n                                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"button\", {\n                                            className: \"bg-purple-500 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded focus:outline-none focus:shadow-outline\",\n                                            type: \"submit\",\n                                            children: \"Enviar\"\n                                        }, void 0, false, {\n                                            fileName: \"/Users/angelparada/Desktop/CBook/ChangeBook/Frontend/app/Perfil/ModalReportar.tsx\",\n                                            lineNumber: 67,\n                                            columnNumber: 29\n                                        }, undefined),\n                                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"button\", {\n                                            className: \"bg-gray-500 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded focus:outline-none focus:shadow-outline\",\n                                            type: \"button\",\n                                            onClick: onButtonClick,\n                                            children: \"Cancelar\"\n                                        }, void 0, false, {\n                                            fileName: \"/Users/angelparada/Desktop/CBook/ChangeBook/Frontend/app/Perfil/ModalReportar.tsx\",\n                                            lineNumber: 73,\n                                            columnNumber: 29\n                                        }, undefined)\n                                    ]\n                                }, void 0, true, {\n                                    fileName: \"/Users/angelparada/Desktop/CBook/ChangeBook/Frontend/app/Perfil/ModalReportar.tsx\",\n                                    lineNumber: 66,\n                                    columnNumber: 25\n                                }, undefined)\n                            ]\n                        }, void 0, true, {\n                            fileName: \"/Users/angelparada/Desktop/CBook/ChangeBook/Frontend/app/Perfil/ModalReportar.tsx\",\n                            lineNumber: 50,\n                            columnNumber: 21\n                        }, undefined),\n                        message && /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"p\", {\n                            className: \"mt-4 text-center rounded-md py-2 px-4 \".concat(message !== \"Comentario enviado con \\xe9xito\" ? \"bg-red-200 text-red-800 border border-red-400\" : \"bg-green-200 text-green-800 border border-green-400\"),\n                            children: message\n                        }, void 0, false, {\n                            fileName: \"/Users/angelparada/Desktop/CBook/ChangeBook/Frontend/app/Perfil/ModalReportar.tsx\",\n                            lineNumber: 83,\n                            columnNumber: 25\n                        }, undefined)\n                    ]\n                }, void 0, true, {\n                    fileName: \"/Users/angelparada/Desktop/CBook/ChangeBook/Frontend/app/Perfil/ModalReportar.tsx\",\n                    lineNumber: 49,\n                    columnNumber: 17\n                }, undefined)\n            }, void 0, false, {\n                fileName: \"/Users/angelparada/Desktop/CBook/ChangeBook/Frontend/app/Perfil/ModalReportar.tsx\",\n                lineNumber: 48,\n                columnNumber: 13\n            }, undefined)\n        ]\n    }, void 0, true, {\n        fileName: \"/Users/angelparada/Desktop/CBook/ChangeBook/Frontend/app/Perfil/ModalReportar.tsx\",\n        lineNumber: 40,\n        columnNumber: 9\n    }, undefined);\n};\n_s(ModalReportar, \"pE/ZQ1t3HNY/HobnzPOEFR9D41c=\");\n_c = ModalReportar;\nvar _c;\n$RefreshReg$(_c, \"ModalReportar\");\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                module.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                module.hot.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGFwcC1wYWdlcy1icm93c2VyKS8uL2FwcC9QZXJmaWwvTW9kYWxSZXBvcnRhci50c3giLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBRTBCO0FBQ087QUFDc0I7QUFDUjtBQU94QyxNQUFNSSxnQkFBZ0I7UUFBQyxFQUFFQyxNQUFNLEVBQUVDLGFBQWEsRUFBUzs7SUFDMUQsTUFBTSxDQUFDQyxhQUFhQyxlQUFlLEdBQUdQLCtDQUFRQSxDQUFDO0lBQy9DLE1BQU0sQ0FBQ1EsU0FBU0MsV0FBVyxHQUFHVCwrQ0FBUUEsQ0FBQztJQUN2QyxNQUFNVSxtQkFBbUJDLGFBQWFDLE9BQU8sQ0FBQztJQUU5QyxNQUFNQyxlQUFlLE9BQU9DO1FBQ3hCQSxFQUFFQyxjQUFjO1FBQ2hCLElBQUk7WUFDQSxNQUFNQyxXQUFXLE1BQU1qQiw2Q0FBS0EsQ0FBQ2tCLElBQUksQ0FBQyxrQkFBeUIsT0FBUGIsU0FBVTtnQkFBRUU7Z0JBQWFJO1lBQWlCO1lBQzlGUixpREFBS0EsQ0FBQ2dCLE9BQU8sQ0FBQyw2QkFBNkI7Z0JBQ3ZDQyxXQUFXO2dCQUNYQyxpQkFBaUI7Z0JBQ2pCQyxVQUFVO1lBQ2Q7WUFDQWhCLGlCQUFrQiw0QkFBNEI7UUFDbEQsRUFBRSxPQUFPaUIsT0FBTztZQUNaQyxRQUFRRCxLQUFLLENBQUMsa0NBQWtDQTtZQUNoRHBCLGlEQUFLQSxDQUFDb0IsS0FBSyxDQUFDLDhCQUE4QjtnQkFDdENILFdBQVc7Z0JBQ1hDLGlCQUFpQjtnQkFDakJDLFVBQVU7WUFDZDtRQUNKO1FBQ0FFLFFBQVFDLEdBQUcsQ0FBQ2hCO0lBQ2hCO0lBRUEscUJBQ0ksOERBQUNpQjs7MEJBQ0csOERBQUN4QiwwREFBY0E7Ozs7OzBCQUVmLDhEQUFDd0I7Z0JBQ0dDLFdBQVU7Ozs7OzswQkFJZCw4REFBQ0Q7Z0JBQUlDLFdBQVU7MEJBQ1gsNEVBQUNEO29CQUFJQyxXQUFVOztzQ0FDWCw4REFBQ0M7NEJBQUtDLFVBQVVmOzs4Q0FDWiw4REFBQ1k7b0NBQUlDLFdBQVU7O3NEQUNYLDhEQUFDRDs0Q0FBSUMsV0FBVTtzREFDWCw0RUFBQ0c7Z0RBQU1ILFdBQVU7MERBQTZDOzs7Ozs7Ozs7OztzREFJbEUsOERBQUNJOzRDQUNHSixXQUFVOzRDQUNWSyxJQUFHOzRDQUNIQyxNQUFLOzRDQUNMQyxhQUFZOzRDQUNaQyxPQUFPNUI7NENBQ1A2QixVQUFVLENBQUNyQixJQUFNUCxlQUFlTyxFQUFFc0IsTUFBTSxDQUFDRixLQUFLOzs7Ozs7Ozs7Ozs7OENBR3RELDhEQUFDVDtvQ0FBSUMsV0FBVTs7c0RBQ1gsOERBQUNXOzRDQUNHWCxXQUFVOzRDQUNWWSxNQUFLO3NEQUNSOzs7Ozs7c0RBR0QsOERBQUNEOzRDQUNHWCxXQUFVOzRDQUNWWSxNQUFLOzRDQUNMQyxTQUFTbEM7c0RBQ1o7Ozs7Ozs7Ozs7Ozs7Ozs7Ozt3QkFLUkcseUJBQ0csOERBQUNnQzs0QkFBRWQsV0FBVyx5Q0FBOEwsT0FBckpsQixZQUFZLG9DQUFpQyxrREFBa0Q7c0NBQ2pKQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFPN0IsRUFBQztHQTlFWUw7S0FBQUEiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9fTl9FLy4vYXBwL1BlcmZpbC9Nb2RhbFJlcG9ydGFyLnRzeD8zYjJlIl0sInNvdXJjZXNDb250ZW50IjpbIid1c2UgY2xpZW50J1xuXG5pbXBvcnQgYXhpb3MgZnJvbSBcImF4aW9zXCI7XG5pbXBvcnQgeyB1c2VTdGF0ZSB9IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IHsgVG9hc3RDb250YWluZXIsIHRvYXN0IH0gZnJvbSBcInJlYWN0LXRvYXN0aWZ5XCI7XG5pbXBvcnQgXCJyZWFjdC10b2FzdGlmeS9kaXN0L1JlYWN0VG9hc3RpZnkuY3NzXCI7XG5cbmludGVyZmFjZSBQcm9wcyB7XG4gICAgY29kaWdvOiBzdHJpbmcgfCBudWxsXG4gICAgb25CdXR0b25DbGljazogKCkgPT4gdm9pZDtcbn1cblxuZXhwb3J0IGNvbnN0IE1vZGFsUmVwb3J0YXIgPSAoeyBjb2RpZ28sIG9uQnV0dG9uQ2xpY2sgfTogUHJvcHMpID0+IHtcbiAgICBjb25zdCBbZGVzY3JpcGNpb24sIHNldERlc2NyaXBjaW9uXSA9IHVzZVN0YXRlKCcnKTtcbiAgICBjb25zdCBbbWVzc2FnZSwgc2V0TWVzc2FnZV0gPSB1c2VTdGF0ZSgnJyk7XG4gICAgY29uc3QgY29kaWdvX3JlbWl0ZW50ZSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwiY29kaWdvVXN1YXJpb1wiKTtcblxuICAgIGNvbnN0IGhhbmRsZVN1Ym1pdCA9IGFzeW5jIChlOiBhbnkpID0+IHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5wb3N0KGAvYXBpL3JlcG9ydC90by8ke2NvZGlnb31gLCB7IGRlc2NyaXBjaW9uLCBjb2RpZ29fcmVtaXRlbnRlIH0pO1xuICAgICAgICAgICAgdG9hc3Quc3VjY2VzcyhcIlJlcG9ydGUgZW52aWFkbyBjb24gZXhpdG9cIiwge1xuICAgICAgICAgICAgICAgIGF1dG9DbG9zZTogMTAwMCwgIC8vIER1cmFjacOzbiBkZSAxMDAwIG1zICgxIHNlZ3VuZG8pXG4gICAgICAgICAgICAgICAgaGlkZVByb2dyZXNzQmFyOiB0cnVlLFxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBcInRvcC1jZW50ZXJcIixcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgb25CdXR0b25DbGljaygpOyAgLy8gQ2VycmFyIGVsIG1vZGFsIGFsIGVudmlhclxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgYWwgZW52aWFyIGVsIGZvcm11bGFyaW86JywgZXJyb3IpO1xuICAgICAgICAgICAgdG9hc3QuZXJyb3IoXCJGYWxsbyBkZSBlbnZpbyBkZWwgcmVwb3J0ZVwiLCB7XG4gICAgICAgICAgICAgICAgYXV0b0Nsb3NlOiAxMDAwLCAgLy8gRHVyYWNpw7NuIGRlIDEwMDAgbXMgKDEgc2VndW5kbylcbiAgICAgICAgICAgICAgICBoaWRlUHJvZ3Jlc3NCYXI6IHRydWUsXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IFwidG9wLWNlbnRlclwiLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5sb2cobWVzc2FnZSk7XG4gICAgfTtcblxuICAgIHJldHVybiAoXG4gICAgICAgIDxkaXY+XG4gICAgICAgICAgICA8VG9hc3RDb250YWluZXIvPlxuICAgICAgICAgICAgey8qIEJsYWNrIGJhY2tncm91bmQgKi99XG4gICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZml4ZWQgdG9wLTAgbGVmdC0wIHctc2NyZWVuIGgtc2NyZWVuIHotMTAgYmctYmxhY2sgb3BhY2l0eS0zMFwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIHsvKiBCbHVyICovfVxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmaXhlZCB0b3AtMCBsZWZ0LTAgdy1zY3JlZW4gaC1zY3JlZW4gei0xMCBiYWNrZHJvcC1maWx0ZXIgYmFja2Ryb3AtYmx1ci1zbSBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlclwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctd2hpdGUgcC0xMCByb3VuZGVkLWxnIHNoYWRvdy0yeGwgdy1mdWxsIG1heC13LTJ4bFwiPlxuICAgICAgICAgICAgICAgICAgICA8Zm9ybSBvblN1Ym1pdD17aGFuZGxlU3VibWl0fT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWItNlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHctZnVsbCBtYi05XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJibG9jayB0ZXh0LWdyYXktNzAwIHRleHQtbGcgZm9udC1ib2xkIG1iLTJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIERlc2NyaWJlIGxvcyBoZWNob3MuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRleHRhcmVhXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInNoYWRvdyBhcHBlYXJhbmNlLW5vbmUgYm9yZGVyIHJvdW5kZWQgdy1mdWxsIHB5LTMgcHgtNCB0ZXh0LWdyYXktNzAwIGxlYWRpbmctdGlnaHQgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOnNoYWRvdy1vdXRsaW5lXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ9XCJkZXNjcmlwY2lvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvd3M9XCI4XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJFc2NyaWJlIHR1IGRlc2NyaXBjacOzbiBhcXXDrVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtkZXNjcmlwY2lvbn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXREZXNjcmlwY2lvbihlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPjwvdGV4dGFyZWE+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgc3BhY2UteC00XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJiZy1wdXJwbGUtNTAwIGhvdmVyOmJnLXB1cnBsZS03MDAgdGV4dC13aGl0ZSBmb250LWJvbGQgcHktMyBweC02IHJvdW5kZWQgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOnNoYWRvdy1vdXRsaW5lXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cInN1Ym1pdFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBFbnZpYXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImJnLWdyYXktNTAwIGhvdmVyOmJnLWdyYXktNzAwIHRleHQtd2hpdGUgZm9udC1ib2xkIHB5LTMgcHgtNiByb3VuZGVkIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpzaGFkb3ctb3V0bGluZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXtvbkJ1dHRvbkNsaWNrfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQ2FuY2VsYXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgICAgICAgICAgICAgIHttZXNzYWdlICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT17YG10LTQgdGV4dC1jZW50ZXIgcm91bmRlZC1tZCBweS0yIHB4LTQgJHttZXNzYWdlICE9PSBcIkNvbWVudGFyaW8gZW52aWFkbyBjb24gw6l4aXRvXCIgPyAnYmctcmVkLTIwMCB0ZXh0LXJlZC04MDAgYm9yZGVyIGJvcmRlci1yZWQtNDAwJyA6ICdiZy1ncmVlbi0yMDAgdGV4dC1ncmVlbi04MDAgYm9yZGVyIGJvcmRlci1ncmVlbi00MDAnfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHttZXNzYWdlfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgIClcbn1cbiJdLCJuYW1lcyI6WyJheGlvcyIsInVzZVN0YXRlIiwiVG9hc3RDb250YWluZXIiLCJ0b2FzdCIsIk1vZGFsUmVwb3J0YXIiLCJjb2RpZ28iLCJvbkJ1dHRvbkNsaWNrIiwiZGVzY3JpcGNpb24iLCJzZXREZXNjcmlwY2lvbiIsIm1lc3NhZ2UiLCJzZXRNZXNzYWdlIiwiY29kaWdvX3JlbWl0ZW50ZSIsImxvY2FsU3RvcmFnZSIsImdldEl0ZW0iLCJoYW5kbGVTdWJtaXQiLCJlIiwicHJldmVudERlZmF1bHQiLCJyZXNwb25zZSIsInBvc3QiLCJzdWNjZXNzIiwiYXV0b0Nsb3NlIiwiaGlkZVByb2dyZXNzQmFyIiwicG9zaXRpb24iLCJlcnJvciIsImNvbnNvbGUiLCJsb2ciLCJkaXYiLCJjbGFzc05hbWUiLCJmb3JtIiwib25TdWJtaXQiLCJsYWJlbCIsInRleHRhcmVhIiwiaWQiLCJyb3dzIiwicGxhY2Vob2xkZXIiLCJ2YWx1ZSIsIm9uQ2hhbmdlIiwidGFyZ2V0IiwiYnV0dG9uIiwidHlwZSIsIm9uQ2xpY2siLCJwIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(app-pages-browser)/./app/Perfil/ModalReportar.tsx\n"));

/***/ })

});