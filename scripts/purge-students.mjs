import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STUDENT_BUCKET = "student-photos";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function emptyBucketRecursively(bucketId, path = "") {
  // List files and folders at current path
  const { data, error } = await supabase.storage.from(bucketId).list(path, {
    limit: 100,
    offset: 0,
    sortBy: { column: "name", order: "asc" },
  });
  if (error) throw error;
  if (!data || data.length === 0) return;

  const files = [];
  const folders = [];
  for (const item of data) {
    if (item.id || item.updated_at) {
      // file
      files.push(path ? `${path}/${item.name}` : item.name);
    } else if (item.name) {
      // folder
      folders.push(path ? `${path}/${item.name}` : item.name);
    }
  }

  if (files.length > 0) {
    const { error: removeErr } = await supabase.storage.from(bucketId).remove(files);
    if (removeErr) throw removeErr;
  }

  for (const folder of folders) {
    await emptyBucketRecursively(bucketId, folder);
  }
}

async function purgeStudents() {
  console.log("Purging student data...");

  // 1) Delete all rows from students
  const { error: deleteErr } = await supabase.from("students").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (deleteErr) throw deleteErr;
  console.log("Deleted all rows from students table.");

  // 2) Empty storage bucket
  try {
    await emptyBucketRecursively(STUDENT_BUCKET, "");
    console.log(`Emptied storage bucket: ${STUDENT_BUCKET}`);
  } catch (e) {
    // If bucket doesn't exist yet, ignore
    if (e && e.message && e.message.includes("not found")) {
      console.log(`Bucket ${STUDENT_BUCKET} not found; skipping.`);
    } else {
      throw e;
    }
  }

  console.log("Purge complete.");
}

purgeStudents().catch((err) => {
  console.error("Purge failed:", err);
  process.exit(1);
});


