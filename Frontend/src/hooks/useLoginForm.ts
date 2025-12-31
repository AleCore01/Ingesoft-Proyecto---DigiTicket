// src/hooks/useLoginForm.ts
import { useState } from "react";
import type { LoginFormData, FormErrors, LoginFormState } from "../types";
import { authService } from "../services/auth.service";
import type { LoginRes } from "../types/auth";

const useLoginForm = () => {
  const [formState, setFormState] = useState<LoginFormState>({
    data: { email: "", password: "" },
    errors: {},
    isLoading: false,
  });

  // ── Validaciones básicas ──────────────────────────────────────────────
  const validateEmail = (email: string): string | undefined => {
    if (!email) return "El correo electrónico es obligatorio";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Formato de correo electrónico inválido";
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return "La contraseña es obligatoria";
    if (password.length < 8) return "Debe contener al menos 8 caracteres";
    return undefined;
  };

  const updateField = (field: keyof LoginFormData, value: string) => {
    setFormState((prev) => ({
      ...prev,
      data: { ...prev.data, [field]: value },
      errors: { ...prev.errors, [field]: undefined, general: undefined },
    }));
  };

  const validateForm = (): boolean => {
    const emailError = validateEmail(formState.data.email);
    const passwordError = validatePassword(formState.data.password);

    const errors: FormErrors = {};
    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;

    setFormState((prev) => ({ ...prev, errors }));
    return Object.keys(errors).length === 0;
  };

  // ── Submit: usa authService.login (fetch wrapper) ─────────────────────
  const submitForm = async (): Promise<LoginRes | void> => {
    if (!validateForm()) return;

    setFormState((prev) => ({ ...prev, isLoading: true, errors: {} }));

    try {
      // Llama a tu service (ajusta tipos de LoginRes según tu backend)
      const res = (await authService.login(
        formState.data.email,
        formState.data.password
      )) as unknown as LoginRes & Record<string, any>;

      // Persistencia opcional: soporta respuesta {accessToken,user} o {token,id,role,name}
      const token = res?.accessToken ?? res?.token;
      if (token) localStorage.setItem("token", token);

      const user =
        res?.user ??
        (res?.id
          ? { id: res.id, role: res.role, name: res.name }
          : undefined);

      if (user) localStorage.setItem("user", JSON.stringify(user));

      return res as LoginRes;
    } catch (error: any) {
      setFormState((prev) => ({
        ...prev,
        errors: { ...prev.errors, general: error?.message || "Credenciales incorrectas" },
      }));
    } finally {
      setFormState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return {
    formState,
    updateField,
    submitForm,
  };
};

export default useLoginForm;
