const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const rootDir = path.resolve(__dirname, "..");

process.env.NEXT_PUBLIC_APP_URL ||= "http://localhost:3000";
process.env.NEXT_PUBLIC_API_URL ||= "http://localhost:4000/api/v1";

const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    const target = path.join(rootDir, request.slice(2));
    const resolved = ["", ".ts", ".tsx", ".js", ".jsx"]
      .map((extension) => `${target}${extension}`)
      .find((candidate) => fs.existsSync(candidate));

    if (resolved) {
      return resolved;
    }
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};

require.extensions[".ts"] = function compileTypeScript(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: filename,
  }).outputText;

  module._compile(output, filename);
};

require.extensions[".tsx"] = require.extensions[".ts"];

const { ApiError } = require("@/lib/api");
const {
  getLoginSuccessPath,
  getRegisterSuccessPath,
  resolveLoginError,
  resolveRegisterError,
} = require("@/lib/auth-flow");

function makeApiError({ code, field, message, nextStep, redirectTo, status }) {
  return new ApiError({
    code,
    details: [{ field, message, nextStep, redirectTo }],
    message,
    status,
  });
}

function parsePath(href) {
  return new URL(href, "http://localhost");
}

test("registro exitoso navega a OTP", () => {
  const href = getRegisterSuccessPath({ nextStep: "verify_otp" }, "DA@Gmail.com");
  const url = parsePath(href);

  assert.equal(url.pathname, "/verificar-otp");
  assert.equal(url.searchParams.get("purpose"), "register");
  assert.equal(url.searchParams.get("auto"), "1");
  assert.equal(url.searchParams.get("next"), "/registro?step=datos");
  assert.equal(url.searchParams.get("recipient"), "da@gmail.com");
});

test("registro con EMAIL_ALREADY_EXISTS muestra accion a login y no OTP", () => {
  const result = resolveRegisterError(
    makeApiError({
      code: "EMAIL_ALREADY_EXISTS",
      field: "email",
      message: "Este correo ya esta registrado.",
      nextStep: "login",
      redirectTo: "/auth/login",
      status: 409,
    }),
    "DA@Gmail.com",
  );
  const url = parsePath(result.action.href);

  assert.equal(result.fieldErrors.email, "Este correo ya esta registrado.");
  assert.equal(result.action.label, "Iniciar sesion");
  assert.equal(url.pathname, "/auth/login");
  assert.equal(url.searchParams.get("email"), "da@gmail.com");
  assert.notEqual(url.pathname, "/verificar-otp");
});

test("registro con DOCUMENT_ALREADY_EXISTS muestra accion a login y no OTP", () => {
  const result = resolveRegisterError(
    makeApiError({
      code: "DOCUMENT_ALREADY_EXISTS",
      field: "documentNumber",
      message: "Ya existe una cuenta asociada a este documento.",
      nextStep: "login",
      redirectTo: "/auth/login",
      status: 409,
    }),
    "persona@example.com",
  );
  const url = parsePath(result.action.href);

  assert.equal(result.fieldErrors.documentNumber, "Ya existe una cuenta asociada a este documento.");
  assert.equal(result.action.label, "Iniciar sesion");
  assert.equal(url.pathname, "/auth/login");
  assert.equal(url.searchParams.get("email"), "persona@example.com");
  assert.notEqual(url.pathname, "/verificar-otp");
});

test("login con USER_NOT_REGISTERED muestra accion a registro", () => {
  const result = resolveLoginError(
    makeApiError({
      code: "USER_NOT_REGISTERED",
      field: "email",
      message: "Este correo no esta registrado.",
      nextStep: "register",
      redirectTo: "/registro",
      status: 404,
    }),
    "nuevo@example.com",
  );
  const url = parsePath(result.action.href);

  assert.equal(result.fieldErrors.email, "Este correo no esta registrado.");
  assert.equal(result.action.label, "Crear cuenta");
  assert.equal(url.pathname, "/registro");
  assert.equal(url.searchParams.get("email"), "nuevo@example.com");
});

test("login con INVALID_CREDENTIALS muestra error y no redirige a registro", () => {
  const result = resolveLoginError(
    makeApiError({
      code: "INVALID_CREDENTIALS",
      field: undefined,
      message: "Correo o contrasena incorrectos.",
      status: 401,
    }),
    "user@example.com",
  );

  assert.equal(result.fieldErrors.password, "Correo o contrasena incorrectos.");
  assert.equal(result.action, null);
});

test("login exitoso usa nextStep del backend", () => {
  const href = getLoginSuccessPath({ nextStep: "dashboard" }, "user@example.com");

  assert.equal(href, "/app/dashboard");
});
