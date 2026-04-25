import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { where, orderBy, addDoc, collection, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { motion } from 'framer-motion'
import { Upload, FileText, AlertTriangle, CheckCircle, Clock, X, ChevronRight, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { db } from '../../services/firebase'
import { uploadPatientDocument } from '../../services/storage'
import { analyzeDocument } from '../../services/gemini'
import { useAuth } from '../../hooks/useAuth'
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection'
import { GlassCard } from '../../components/ui/GlassCard'
import { Badge } from '../../components/ui/Badge'
import { SkeletonList } from '../../components/ui/Skeleton'
import { formatDate } from '../../lib/format'
import { fadeRise, stagger } from '../../lib/motion'
import type { PatientDocument, DocumentCategory } from '../../types'

const MAX_SIZE = 20 * 1024 * 1024 // 20MB
const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/heic': ['.heic'],
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
}

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  lab_result: 'Lab Result',
  prescription: 'Prescription',
  scan_report: 'Scan Report',
  discharge_summary: 'Discharge Summary',
  other: 'Other',
}

function detectCategory(filename: string): DocumentCategory {
  const lower = filename.toLowerCase()
  if (lower.includes('lab') || lower.includes('blood') || lower.includes('cbc') || lower.includes('result')) return 'lab_result'
  if (lower.includes('rx') || lower.includes('prescription') || lower.includes('med')) return 'prescription'
  if (lower.includes('mri') || lower.includes('ct') || lower.includes('xray') || lower.includes('scan') || lower.includes('imaging')) return 'scan_report'
  if (lower.includes('discharge') || lower.includes('summary')) return 'discharge_summary'
  return 'other'
}

function UploadZone({ onUpload }: { onUpload: (files: File[]) => void }) {
  const [isDragging, setIsDragging] = useState(false)

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: onUpload,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    multiple: true,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onDropAccepted: () => setIsDragging(false),
    onDropRejected: (rejections) => {
      setIsDragging(false)
      if (rejections.some((r) => r.errors.some((e) => e.code === 'file-too-large'))) {
        toast.error('File too large. Maximum size is 20 MB.')
      } else {
        toast.error('Unsupported file type. Use PDF, JPG, PNG, or DOCX.')
      }
    },
  })

  return (
    <div
      {...getRootProps()}
      className="cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200"
      style={{
        borderColor: isDragging ? 'var(--accent-teal)' : 'var(--border-subtle)',
        background: isDragging ? 'var(--accent-teal-glow)' : 'var(--surface-tint)',
      }}
    >
      <input {...getInputProps()} />
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all"
        style={{
          background: isDragging ? 'var(--accent-teal-glow)' : 'var(--bg-elevated)',
          color: isDragging ? 'var(--accent-teal)' : 'var(--text-muted)',
        }}
      >
        <Upload size={28} strokeWidth={1.5} />
      </div>
      <p className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
        {isDragging ? 'Drop to upload' : 'Drop a file here, or tap to browse'}
      </p>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        PDF, JPG, PNG, DOCX up to 20 MB
      </p>
      <div className="flex justify-center gap-3 mt-4">
        {['PDF', 'JPG', 'PNG', 'DOCX'].map((t) => (
          <span key={t} className="text-xs px-2 py-0.5 rounded-md font-mono"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function Documents() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [uploading, setUploading] = useState<Record<string, number>>({})

  const { data: documents, loading } = useFirestoreCollection<PatientDocument>(
    'patient_documents',
    user ? [where('patientId', '==', user.uid), orderBy('uploadedAt', 'desc')] : []
  )

  const handleUpload = useCallback(async (files: File[]) => {
    if (!user) return
    for (const file of files) {
      const docId = `${Date.now()}_${Math.random().toString(36).slice(2)}`
      setUploading((prev) => ({ ...prev, [docId]: 0 }))
      try {
        const { downloadUrl, storagePath } = await uploadPatientDocument(user.uid, docId, file, (pct) => {
          setUploading((prev) => ({ ...prev, [docId]: pct }))
        })

        const category = detectCategory(file.name)
        const docRef = await addDoc(collection(db, 'patient_documents'), {
          docId,
          patientId: user.uid,
          filename: file.name,
          storagePath,
          downloadUrl,
          contentType: file.type,
          uploadedAt: serverTimestamp(),
          category,
          analysisStatus: 'pending',
          fileSize: file.size,
        })

        toast.success(`Uploaded ${file.name}. Analyzing...`)

        // Run Gemini analysis
        try {
          let fileToAnalyze = file
          if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const mammoth = await import('mammoth')
            const buffer = await file.arrayBuffer()
            const { value: text } = await mammoth.extractRawText({ arrayBuffer: buffer })
            fileToAnalyze = new File([text], file.name, { type: 'text/plain' })
          }

          const analysis = await analyzeDocument(fileToAnalyze)
          await updateDoc(doc(db, 'patient_documents', docRef.id), {
            analysis,
            analysisStatus: 'complete',
          })
          toast.success(`Analysis complete for ${file.name}`)
        } catch {
          await updateDoc(doc(db, 'patient_documents', docRef.id), { analysisStatus: 'failed' })
          toast.error(`Could not analyze ${file.name}. You can view the raw file.`)
        }
      } catch {
        toast.error(`Upload failed for ${file.name}`)
      } finally {
        setUploading((prev) => { const n = { ...prev }; delete n[docId]; return n })
      }
    }
  }, [user])

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="max-w-3xl mx-auto space-y-6">
      <motion.div variants={fadeRise}>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>My Documents</h1>
          {documents.length > 0 && (
            <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>{documents.length} files</span>
          )}
        </div>
        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
          Upload lab results, prescriptions, and scan reports for AI-powered plain-language analysis.
        </p>
      </motion.div>

      {/* Upload zone */}
      <motion.div variants={fadeRise}>
        <UploadZone onUpload={handleUpload} />
      </motion.div>

      {/* Active uploads */}
      {Object.entries(uploading).length > 0 && (
        <motion.div variants={fadeRise} className="space-y-2">
          {Object.entries(uploading).map(([id, pct]) => (
            <GlassCard key={id} className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-teal-glow)', color: 'var(--accent-teal)' }}>
                  <Upload size={16} strokeWidth={1.75} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Uploading...</p>
                  <div className="w-full rounded-full h-1.5 mt-1.5" style={{ background: 'var(--border-subtle)' }}>
                    <div className="h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, background: 'var(--accent-teal)' }} />
                  </div>
                </div>
                <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{Math.round(pct)}%</span>
              </div>
            </GlassCard>
          ))}
        </motion.div>
      )}

      {/* Document list */}
      {loading && <SkeletonList count={3} />}

      {!loading && documents.length === 0 && Object.keys(uploading).length === 0 && (
        <motion.div variants={fadeRise}>
          <GlassCard className="p-10 text-center">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--surface-tint)', color: 'var(--text-muted)' }}>
              <FileText size={32} strokeWidth={1.25} />
            </div>
            <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>No documents yet</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Drop your first lab result, prescription, or scan report above.
            </p>
          </GlassCard>
        </motion.div>
      )}

      {documents.length > 0 && (
        <motion.div variants={stagger} className="space-y-3">
          {documents.map((d, i) => (
            <motion.div key={d.id} variants={fadeRise} style={{ transitionDelay: `${i * 40}ms` }}>
              <GlassCard
                variant="interactive"
                className="p-4 cursor-pointer"
                onClick={() => navigate(`/patient/documents/${d.docId}`)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: d.analysisStatus === 'complete'
                        ? 'hsla(265,70%,65%,0.1)'
                        : 'var(--surface-tint)',
                      color: d.analysisStatus === 'complete' ? 'var(--accent-violet)' : 'var(--text-muted)',
                    }}
                  >
                    <FileText size={18} strokeWidth={1.75} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {d.filename}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="default">{CATEGORY_LABELS[d.category]}</Badge>
                      {d.analysisStatus === 'complete' && (
                        <Badge variant="success">
                          <CheckCircle size={10} strokeWidth={2} className="mr-1" />
                          Analyzed
                        </Badge>
                      )}
                      {d.analysisStatus === 'pending' && (
                        <Badge variant="teal">
                          <Clock size={10} strokeWidth={2} className="mr-1" />
                          Pending
                        </Badge>
                      )}
                      {d.analysisStatus === 'failed' && (
                        <Badge variant="danger">
                          <X size={10} strokeWidth={2} className="mr-1" />
                          Failed
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>
                      {d.uploadedAt && formatDate(d.uploadedAt)}
                    </span>
                    <ChevronRight size={16} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>

                {d.analysis?.red_flags && d.analysis.red_flags.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-xs px-3 py-2 rounded-xl"
                    style={{ background: 'hsla(8,90%,65%,0.08)', color: 'var(--accent-coral)' }}>
                    <AlertTriangle size={12} strokeWidth={1.75} />
                    {d.analysis.red_flags.length} item{d.analysis.red_flags.length > 1 ? 's' : ''} need{d.analysis.red_flags.length === 1 ? 's' : ''} attention
                  </div>
                )}
                {d.analysis?.summary && (
                  <div className="mt-3 rounded-xl border px-3 py-2 text-xs leading-relaxed"
                    style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-tint)', color: 'var(--text-secondary)' }}>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Report summary: </span>
                    {d.analysis.summary}
                  </div>
                )}
                {d.downloadUrl && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(d.downloadUrl, '_blank', 'noopener,noreferrer')
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold transition-colors hover:text-[var(--accent-teal)]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <ExternalLink size={12} strokeWidth={1.75} />
                    Open uploaded file
                  </button>
                )}
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
