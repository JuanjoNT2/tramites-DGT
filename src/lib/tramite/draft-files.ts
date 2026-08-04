import { browser } from '$app/environment';

const DB_NAME = 'tdgt-draft-files';
const DB_VERSION = 1;
const STORE = 'files';

type StoredFile = {
	draftKey: string;
	docId: string;
	name: string;
	type: string;
	lastModified: number;
	blob: Blob;
};

function openDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, DB_VERSION);
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains(STORE)) {
				const store = db.createObjectStore(STORE, { keyPath: ['draftKey', 'docId'] });
				store.createIndex('byDraft', 'draftKey', { unique: false });
			}
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error ?? new Error('No se pudo abrir IndexedDB'));
	});
}

function idbReq<T>(req: IDBRequest<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error ?? new Error('Error IndexedDB'));
	});
}

function idbTxDone(tx: IDBTransaction): Promise<void> {
	return new Promise((resolve, reject) => {
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error ?? new Error('Transacción IndexedDB fallida'));
		tx.onabort = () => reject(tx.error ?? new Error('Transacción IndexedDB abortada'));
	});
}

/** Guarda un documento del borrador en IndexedDB (soporta fotos de varios MB). */
export async function saveDraftFile(
	draftKey: string,
	docId: string,
	file: File
): Promise<void> {
	if (!browser || !draftKey || !docId) return;
	try {
		const db = await openDb();
		const tx = db.transaction(STORE, 'readwrite');
		const store = tx.objectStore(STORE);
		const row: StoredFile = {
			draftKey,
			docId,
			name: file.name,
			type: file.type || 'application/octet-stream',
			lastModified: file.lastModified || Date.now(),
			blob: file
		};
		store.put(row);
		await idbTxDone(tx);
		db.close();
	} catch (e) {
		console.warn('[draft-files] no se pudo guardar', docId, e);
	}
}

export async function removeDraftFile(draftKey: string, docId: string): Promise<void> {
	if (!browser || !draftKey || !docId) return;
	try {
		const db = await openDb();
		const tx = db.transaction(STORE, 'readwrite');
		tx.objectStore(STORE).delete([draftKey, docId]);
		await idbTxDone(tx);
		db.close();
	} catch (e) {
		console.warn('[draft-files] no se pudo eliminar', docId, e);
	}
}

/** Restaura los File del borrador para reinyectarlos en el formulario. */
export async function loadDraftFiles(draftKey: string): Promise<Record<string, File>> {
	if (!browser || !draftKey) return {};
	try {
		const db = await openDb();
		const tx = db.transaction(STORE, 'readonly');
		const index = tx.objectStore(STORE).index('byDraft');
		const rows = await idbReq<StoredFile[]>(index.getAll(draftKey));
		db.close();
		const out: Record<string, File> = {};
		for (const row of rows ?? []) {
			out[row.docId] = new File([row.blob], row.name || row.docId, {
				type: row.type || 'application/octet-stream',
				lastModified: row.lastModified || Date.now()
			});
		}
		return out;
	} catch (e) {
		console.warn('[draft-files] no se pudieron cargar', e);
		return {};
	}
}

export async function clearDraftFiles(draftKey: string): Promise<void> {
	if (!browser || !draftKey) return;
	try {
		const db = await openDb();
		const tx = db.transaction(STORE, 'readwrite');
		const store = tx.objectStore(STORE);
		const index = store.index('byDraft');
		const keys = await idbReq<IDBValidKey[]>(index.getAllKeys(draftKey));
		for (const key of keys ?? []) {
			store.delete(key);
		}
		await idbTxDone(tx);
		db.close();
	} catch (e) {
		console.warn('[draft-files] no se pudieron limpiar', e);
	}
}

export async function draftFilesCount(draftKey: string): Promise<number> {
	if (!browser || !draftKey) return 0;
	try {
		const db = await openDb();
		const tx = db.transaction(STORE, 'readonly');
		const index = tx.objectStore(STORE).index('byDraft');
		const n = await idbReq<number>(index.count(draftKey));
		db.close();
		return n;
	} catch {
		return 0;
	}
}
