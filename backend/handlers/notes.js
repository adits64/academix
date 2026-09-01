import { Router } from "express";

import { authMiddleware } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";

import {
    createNoteValidator,
    updateNoteValidator
} from "../validators/notes.js";

import {
    create,
    getAll,
    getTeacherNotes,
    getMyNotes,
    find,
    update,
    destroy
} from "../services/notes.js";


const NOTE_ROUTER = Router();


// Authentication required for all note routes
NOTE_ROUTER.use(authMiddleware);


// =====================================================
// CREATE NOTE
// =====================================================
// Teacher can upload notes for a course/batch they teach.

NOTE_ROUTER.post(
    "/",
    authorize("teacher"),
    createNoteValidator,
    async (req, res, next) => {

        try {

            const note = await create(
                req.body,
                req.user.userId
            );

            res.status(201).json(note);

        } catch (error) {
            next(error);
        }
    }
);


// =====================================================
// GET ALL NOTES
// =====================================================
// Admin can see every note.

NOTE_ROUTER.get(
    "/",
    authorize("admin"),
    async (req, res, next) => {

        try {

            const notes = await getAll();

            res.status(200).json(notes);

        } catch (error) {
            next(error);
        }
    }
);


// =====================================================
// GET TEACHER'S NOTES
// =====================================================
// Teacher can see only notes they created.

NOTE_ROUTER.get(
    "/teacher",
    authorize("teacher"),
    async (req, res, next) => {

        try {

            const notes = await getTeacherNotes(
                req.user.userId
            );

            res.status(200).json(notes);

        } catch (error) {
            next(error);
        }
    }
);


// =====================================================
// GET MY NOTES
// =====================================================
// Student sees notes from their enrolled course + batch.

NOTE_ROUTER.get(
    "/my",
    authorize("student"),
    async (req, res, next) => {

        try {

            const notes = await getMyNotes(
                req.user.userId
            );

            res.status(200).json(notes);

        } catch (error) {
            next(error);
        }
    }
);


// =====================================================
// DOWNLOAD NOTE FILE
// =====================================================
// Admin  → any note
// Teacher → their own note
// Student → note from their enrolled course + batch
NOTE_ROUTER.get(
    "/:id/download",
    authorize("admin", "teacher", "student"),
    async (req, res, next) => {
        try {
            const note = await find(
                req.params.id,
                req.user
            );

            if (!note || !note.fileUrl) {
                return res.status(404).json({ message: "Note file not found" });
            }

            // Robust fetch from Cloudinary storage
            let response = await fetch(note.fileUrl);
            let contentType = response.headers.get("content-type") || note.fileType || "application/octet-stream";

            // If direct fetch is restricted (e.g. 401 on Cloudinary PDF/raw uploads)
            if (!response.ok) {
                if (note.fileUrl.includes('/image/upload/') && note.fileUrl.endsWith('.pdf')) {
                    const pngUrl = note.fileUrl.replace(/\.pdf$/i, '.png');
                    const pngRes = await fetch(pngUrl);
                    if (pngRes.ok) {
                        response = pngRes;
                        contentType = 'image/png';
                    } else {
                        const jpgUrl = note.fileUrl.replace(/\.pdf$/i, '.jpg');
                        const jpgRes = await fetch(jpgUrl);
                        if (jpgRes.ok) {
                            response = jpgRes;
                            contentType = 'image/jpeg';
                        }
                    }
                }

                if (!response.ok && note.fileUrl.includes('/upload/')) {
                    const autoUrl = note.fileUrl.replace('/upload/', '/upload/f_auto/').replace(/\.[^/.]+$/, '');
                    const autoRes = await fetch(autoUrl);
                    if (autoRes.ok) {
                        response = autoRes;
                        contentType = autoRes.headers.get("content-type") || 'application/octet-stream';
                    }
                }
            }

            if (!response.ok) {
                return res.status(404).json({ message: "Unable to retrieve note from storage" });
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            let rawFileName = note.fileName || (note.title ? `${note.title}.pdf` : 'note.pdf');
            if (contentType === 'image/png' && rawFileName.endsWith('.pdf')) {
                rawFileName = rawFileName.replace(/\.pdf$/i, '.png');
            } else if (contentType === 'image/jpeg' && rawFileName.endsWith('.pdf')) {
                rawFileName = rawFileName.replace(/\.pdf$/i, '.jpg');
            }

            const sanitizedFileName = rawFileName.replace(/[/\\?%*:|"<>]/g, '_');

            res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(sanitizedFileName)}"; filename*=UTF-8''${encodeURIComponent(sanitizedFileName)}`);
            res.setHeader("Content-Type", contentType);
            res.setHeader("Content-Length", buffer.length);
            res.setHeader("Access-Control-Expose-Headers", "Content-Disposition, Content-Type, Content-Length");

            return res.send(buffer);
        } catch (error) {
            next(error);
        }
    }
);


// =====================================================
// GET ONE NOTE
// =====================================================
// Admin  → any note
// Teacher → their own note
// Student → note from their enrolled course + batch

NOTE_ROUTER.get(
    "/:id",
    authorize("admin", "teacher", "student"),
    async (req, res, next) => {

        try {

            const note = await find(
                req.params.id,
                req.user
            );

            res.status(200).json(note);

        } catch (error) {
            next(error);
        }
    }
);


// =====================================================
// UPDATE NOTE
// =====================================================
// Teacher can update only their own note.

NOTE_ROUTER.patch(
    "/:id",
    authorize("teacher"),
    updateNoteValidator,
    async (req, res, next) => {

        try {

            const note = await update(
                req.params.id,
                req.body,
                req.user.userId
            );

            res.status(200).json(note);

        } catch (error) {
            next(error);
        }
    }
);


// =====================================================
// DELETE NOTE
// =====================================================
// Teacher can delete only their own note.

NOTE_ROUTER.delete(
    "/:id",
    authorize("admin", "teacher"),
    async (req, res, next) => {

        try {

            const note = await destroy(
                req.params.id,
                req.user
            );

            res.status(200).json(note);

        } catch (error) {
            next(error);
        }
    }
);


export default NOTE_ROUTER;