import { supabase } from '@/integrations/supabase/client';

export interface StudentEvidence {
  id: string;
  userId: string;
  pillarId: string | null;
  title: string;
  description: string;
  filePath: string;
  evidenceType: string;
  createdAt: string;
  /** Signed URL for display — populated client-side */
  fileUrl?: string;
}

/**
 * Upload a file to student-artifacts bucket and create an evidence record.
 */
export async function uploadEvidence(
  userId: string,
  file: File,
  title: string,
  description: string,
  evidenceType: string,
  pillarId?: string,
): Promise<StudentEvidence | null> {
  const ext = file.name.split('.').pop() || 'bin';
  const filePath = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from('student-artifacts')
    .upload(filePath, file, { upsert: false });

  if (uploadErr) {
    console.error('evidenceService.upload storage error:', uploadErr);
    return null;
  }

  const { data, error: insertErr } = await supabase
    .from('student_evidence')
    .insert({
      user_id: userId,
      pillar_id: pillarId || null,
      title,
      description,
      file_path: filePath,
      evidence_type: evidenceType,
    } as any)
    .select('*')
    .single();

  if (insertErr || !data) {
    console.error('evidenceService.upload insert error:', insertErr);
    return null;
  }

  return mapRow(data);
}

/**
 * List all evidence for a user, with signed download URLs.
 */
export async function listEvidence(userId: string): Promise<StudentEvidence[]> {
  const { data, error } = await supabase
    .from('student_evidence')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  const items = data.map(mapRow);

  // Batch-generate signed URLs
  const paths = items.map(i => i.filePath);
  if (paths.length > 0) {
    const { data: urlData } = await supabase.storage
      .from('student-artifacts')
      .createSignedUrls(paths, 3600);

    if (urlData) {
      urlData.forEach((u, i) => {
        if (u.signedUrl) items[i].fileUrl = u.signedUrl;
      });
    }
  }

  return items;
}

/**
 * Delete an evidence record and its associated file.
 */
export async function deleteEvidence(evidenceId: string, filePath: string): Promise<boolean> {
  const { error: storageErr } = await supabase.storage
    .from('student-artifacts')
    .remove([filePath]);

  if (storageErr) console.error('evidenceService.delete storage error:', storageErr);

  const { error: dbErr } = await supabase
    .from('student_evidence')
    .delete()
    .eq('id', evidenceId);

  return !dbErr;
}

function mapRow(r: any): StudentEvidence {
  return {
    id: r.id,
    userId: r.user_id,
    pillarId: r.pillar_id,
    title: r.title,
    description: r.description || '',
    filePath: r.file_path,
    evidenceType: r.evidence_type,
    createdAt: r.created_at,
  };
}
