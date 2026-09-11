import { describe, expect, it } from "vitest";
import { deleteTasks, parseTaskIds, taskWhere } from "../src/tasks";
import type { Env, Project, TaskRecord } from "../src/types";
import { dashboardPage, taskDetailPage, tasksPage } from "../src/ui/pages";

function sampleTask(id = 1): TaskRecord {
  return {
    id,
    projectId: "proj_abcd1234",
    source: "renew",
    title: "续期完成",
    content: "ok",
    level: "success",
    data: { total: 1, success: 1, failed: 0, details: [] },
    emailStatus: "sent",
    telegramStatus: "sent",
    emailMessageId: "m1",
    telegramMessageId: "m2",
    sendStatus: "sent",
    error: null,
    createdAt: "2026-01-02T03:04:05.000Z",
  };
}

function sampleProject(): Project {
  return {
    id: "proj_abcd1234",
    name: "demo",
    apiKey: "k",
    apiKeyHash: "h",
    channels: ["email"],
    enabled: true,
    deleted: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("parseTaskIds", () => {
  it("accepts arrays, csv, and numbers, and dedupes", () => {
    expect(parseTaskIds(["1", "2", "2", "nope"])).toEqual([1, 2]);
    expect(parseTaskIds("3,4,4")).toEqual([3, 4]);
    expect(parseTaskIds(5)).toEqual([5]);
  });

  it("rejects unsafe values", () => {
    expect(parseTaskIds(["-1", "1e2", "01abc", "0", "../../x"])).toEqual([]);
  });
});

describe("taskWhere", () => {
  it("builds AND clauses", () => {
    expect(taskWhere({ projectId: "p", status: "failed" })).toEqual({
      clause: "WHERE project_id = ? AND send_status = ?",
      binds: ["p", "failed"],
    });
  });

  it("is empty without filters", () => {
    expect(taskWhere({})).toEqual({ clause: "", binds: [] });
  });
});

describe("deleteTasks", () => {
  it("deletes matching ids in chunks and reports changes", async () => {
    const remaining = new Set([1, 2, 3]);
    const env = {
      DB: {
        prepare(sql: string) {
          return {
            bind(...args: unknown[]) {
              return {
                async run() {
                  if (!sql.includes("WHERE id IN")) return { meta: { changes: 0 } };
                  let changes = 0;
                  for (const a of args) {
                    if (remaining.delete(Number(a))) changes++;
                  }
                  return { meta: { changes } };
                },
              };
            },
          };
        },
      },
    } as unknown as Env;
    await expect(deleteTasks(env, [1, 3, 9])).resolves.toBe(2);
    expect([...remaining]).toEqual([2]);
  });
});

describe("task pages", () => {
  it("renders select-all, row delete, bulk delete, and filter reset", () => {
    const html = tasksPage(
      "a@b.com",
      [sampleTask(11), sampleTask(12)],
      { proj_abcd1234: "demo" },
      [sampleProject()],
      { status: "failed" },
      2,
    );
    expect(html).toContain('id="task-select-all"');
    expect(html).toContain("删除所选");
    expect(html).toContain("删除筛选结果（2）");
    expect(html).toContain('form="del-task-11"');
    expect(html).toContain('href="/tasks"');
    expect(html).toContain("重置");
    expect(html).toContain('name="ids" value="11"');
  });

  it("keeps dashboard recent tasks read-only", () => {
    const html = dashboardPage("a@b.com", { projects: 1, total: 1, sent: 1, partial: 0, failed: 0 }, [sampleTask()], {
      proj_abcd1234: "demo",
    });
    expect(html).not.toContain("删除所选");
    expect(html).not.toContain("id=\"task-bulk\"");
    expect(html).not.toContain("del-task-");
  });

  it("adds a delete button on the task detail page", () => {
    const html = taskDetailPage("a@b.com", sampleTask(9), "demo");
    expect(html).toContain('action="/api/tasks/9"');
    expect(html).toContain("删除任务");
  });
});
