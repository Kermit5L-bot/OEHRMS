"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type LoginErrors = {
  username?: string;
  password?: string;
  submit?: string;
};

export function AdminLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate() {
    const nextErrors: LoginErrors = {};
    if (!username.trim()) nextErrors.username = "请输入用户名";
    if (!password) nextErrors.password = "请输入密码";
    return nextErrors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        setErrors({ submit: result.error || "用户名或密码错误" });
        return;
      }

      router.push("/admin/appointments");
      router.refresh();
    } catch {
      setErrors({ submit: "登录失败，请稍后重试" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-slate-700">用户名</span>
        <input
          value={username}
          onChange={(event) => {
            setUsername(event.target.value);
            setErrors((current) => ({ ...current, username: undefined, submit: undefined }));
          }}
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          placeholder="请输入用户名"
          autoComplete="username"
        />
        {errors.username ? <span className="mt-1 block text-xs text-red-600">{errors.username}</span> : null}
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">密码</span>
        <input
          type="password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setErrors((current) => ({ ...current, password: undefined, submit: undefined }));
          }}
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          placeholder="请输入密码"
          autoComplete="current-password"
        />
        {errors.password ? <span className="mt-1 block text-xs text-red-600">{errors.password}</span> : null}
      </label>

      {errors.submit ? <p className="text-sm font-medium text-red-600">{errors.submit}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        aria-label="登录"
        className="w-full rounded-md bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isSubmitting ? "登录中..." : "登录"}
      </button>
    </form>
  );
}
