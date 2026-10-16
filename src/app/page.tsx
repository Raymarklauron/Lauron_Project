"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type TimeRecord = {
  id: string;
  started_at: string;
  ended_at: string | null;
};

function formatDateTime(value: string, options: Intl.DateTimeFormatOptions) {
  return new Date(value).toLocaleString(undefined, options);
}

export default function Home() {
  const [supabase] = useState(() => createClient());
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [recordsOwnerId, setRecordsOwnerId] = useState<string | null>(null);
  const [recordsError, setRecordsError] = useState<{
    ownerId: string;
    message: string;
  } | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [startBusy, setStartBusy] = useState(false);
  const [endBusy, setEndBusy] = useState(false);
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [sessionError, setSessionError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    let mounted = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) {
        setSession(nextSession);
        if (!nextSession) {
          setRecords([]);
          setRecordsOwnerId(null);
          setRecordsError(null);
        }
      }
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) {
        return;
      }

      if (error) {
        setErrorMessage(error.message);
      }
      setSession(data.session);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;

    if (!session) {
      return;
    }

    const ownerId = session.user.id;
    void supabase
      .from("time_records")
      .select("id, started_at, ended_at")
      .eq("user_id", ownerId)
      .order("started_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) {
          return;
        }

        if (error) {
          setRecordsError({ ownerId, message: error.message });
        } else {
          setRecords(data ?? []);
          setRecordsOwnerId(ownerId);
          setRecordsError(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session, supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthBusy(true);
    setErrorMessage("");
    setNoticeMessage("");

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message);
      } else if (data.session) {
        setNoticeMessage("Your account is ready.");
      } else {
        setNoticeMessage(
          "Account created. Check your email to confirm it, then log in.",
        );
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message);
      }
    }

    setAuthBusy(false);
  }

  async function handleSignOut() {
    setErrorMessage("");
    const { error } = await supabase.auth.signOut();
    if (error) {
      setErrorMessage(error.message);
    }
  }

  async function handleStartSession() {
    if (!session) {
      return;
    }

    setStartBusy(true);
    setSessionError("");

    const { data, error } = await supabase
      .from("time_records")
      .insert({ user_id: session.user.id })
      .select("id, started_at, ended_at")
      .single();

    if (error) {
      setSessionError(error.message);
    } else {
      setRecords((currentRecords) => [data, ...currentRecords]);
      setRecordsOwnerId(session.user.id);
    }

    setStartBusy(false);
  }

  async function handleEndSession() {
    if (!session || !activeRecord) {
      return;
    }

    setEndBusy(true);
    setSessionError("");

    const { data, error } = await supabase
      .from("time_records")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", activeRecord.id)
      .eq("user_id", session.user.id)
      .is("ended_at", null)
      .select("id, started_at, ended_at")
      .maybeSingle();

    if (error) {
      setSessionError(error.message);
    } else if (!data) {
      setSessionError(
        "This Session could not be ended. Refresh the page and try again.",
      );
    } else {
      setRecords((currentRecords) =>
        currentRecords.map((record) =>
          record.id === data.id ? data : record,
        ),
      );
    }

    setEndBusy(false);
  }

  async function handleDeleteRecord(record: TimeRecord) {
    if (!session) {
      return;
    }

    const recordDate = formatDateTime(record.started_at, {
      dateStyle: "medium",
      timeStyle: "short",
    });
    if (
      !window.confirm(
        `Delete the time record that started ${recordDate}? This cannot be undone.`,
      )
    ) {
      return;
    }

    setDeletingRecordId(record.id);
    setDeleteError("");

    const { data, error } = await supabase
      .from("time_records")
      .delete()
      .eq("id", record.id)
      .eq("user_id", session.user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      setDeleteError(error.message);
    } else if (!data) {
      setDeleteError(
        "This record could not be deleted. Refresh the page and try again.",
      );
    } else {
      setRecords((currentRecords) =>
        currentRecords.filter((currentRecord) => currentRecord.id !== record.id),
      );
    }

    setDeletingRecordId(null);
  }

  const activeRecord =
    records.find((record) => record.ended_at === null) ?? null;

  if (authLoading) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 items-center px-4 py-12">
        <p className="text-sm text-muted-foreground" role="status">
          Checking your account…
        </p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-4 py-12">
        <header className="flex flex-col gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            VA Time Tracker
          </span>
          <h1 className="text-3xl font-semibold tracking-tight">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-muted-foreground">
            Sign in to keep your personal time records private and available
            when you need them.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>{isSignUp ? "Sign up" : "Log in"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  autoComplete="email"
                  id="email"
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  type="email"
                  value={email}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  id="password"
                  minLength={6}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </div>

              {errorMessage && (
                <p className="text-sm text-destructive" role="alert">
                  {errorMessage}
                </p>
              )}
              {noticeMessage && (
                <p className="text-sm text-muted-foreground" role="status">
                  {noticeMessage}
                </p>
              )}

              <Button disabled={authBusy} type="submit">
                {authBusy
                  ? "Please wait…"
                  : isSignUp
                    ? "Create account"
                    : "Log in"}
              </Button>
            </form>

            <p className="mt-5 text-sm text-muted-foreground">
              {isSignUp ? "Already have an account?" : "New to the tracker?"}{" "}
              <button
                className="font-medium text-foreground underline underline-offset-4"
                disabled={authBusy}
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrorMessage("");
                  setNoticeMessage("");
                }}
                type="button"
              >
                {isSignUp ? "Log in" : "Create an account"}
              </button>
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-12 sm:py-20">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            VA Time Tracker
          </span>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Hello, VA.
          </h1>
          <p className="text-muted-foreground">
            Your personal time records, saved to your account.
          </p>
        </div>
        <Button onClick={handleSignOut} variant="outline">
          Log out
        </Button>
      </header>

      {errorMessage && (
        <p className="text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Current Session</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-4">
          {recordsOwnerId !== session.user.id ? (
            <p className="text-sm text-muted-foreground" role="status">
              Loading your current Session…
            </p>
          ) : activeRecord ? (
            <p className="text-sm text-muted-foreground">
              Started at{" "}
              {formatDateTime(activeRecord.started_at, {
                hour: "numeric",
                minute: "2-digit",
              })}
              . Your Session is in progress.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Ready to record when you begin work.
            </p>
          )}

          {activeRecord ? (
            <Button
              disabled={endBusy || recordsOwnerId !== session.user.id}
              onClick={handleEndSession}
            >
              {endBusy ? "Ending…" : "End Session"}
            </Button>
          ) : (
            <Button
              disabled={
                startBusy || recordsOwnerId !== session.user.id
              }
              onClick={handleStartSession}
            >
              {startBusy ? "Starting…" : "Start Session"}
            </Button>
          )}
          {sessionError && (
            <p className="text-sm text-destructive" role="alert">
              {sessionError}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your time records</CardTitle>
        </CardHeader>
        <CardContent>
          {recordsOwnerId !== session.user.id &&
          recordsError?.ownerId !== session.user.id ? (
            <p className="text-sm text-muted-foreground" role="status">
              Loading your records…
            </p>
          ) : recordsError?.ownerId === session.user.id ? (
            <p className="text-sm text-destructive" role="alert">
              Could not load your records: {recordsError.message}
            </p>
          ) : records.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No time records yet. Start your first Session when you are ready
              to work.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[30rem] text-left text-sm">
                <caption className="sr-only">
                  Your work date, time in, and time out records
                </caption>
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="px-3 py-2 font-medium" scope="col">
                      Work date
                    </th>
                    <th className="px-3 py-2 font-medium" scope="col">
                      Time in
                    </th>
                    <th className="px-3 py-2 font-medium" scope="col">
                      Time out
                    </th>
                    <th className="px-3 py-2 font-medium" scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr
                      className="border-b border-border last:border-0"
                      key={record.id}
                    >
                      <td className="px-3 py-3">
                        {formatDateTime(record.started_at, {
                          dateStyle: "medium",
                        })}
                      </td>
                      <td className="px-3 py-3">
                        {formatDateTime(record.started_at, {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-3 py-3">
                        {record.ended_at
                          ? formatDateTime(record.ended_at, {
                              hour: "numeric",
                              minute: "2-digit",
                            })
                          : "In progress"}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Button
                          disabled={
                            deletingRecordId !== null ||
                            recordsOwnerId !== session.user.id
                          }
                          onClick={() => handleDeleteRecord(record)}
                          size="sm"
                          variant="destructive"
                        >
                          {deletingRecordId === record.id
                            ? "Deleting…"
                            : "Delete"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {deleteError && (
            <p className="mt-4 text-sm text-destructive" role="alert">
              Could not delete the record: {deleteError}
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
