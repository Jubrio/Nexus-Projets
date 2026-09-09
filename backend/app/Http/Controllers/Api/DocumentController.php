<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class DocumentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('documents.view');

        $query = Document::with('user');

        if ($request->filled('documentable_type') && $request->filled('documentable_id')) {
            $query->where('documentable_type', $request->input('documentable_type'))
                  ->where('documentable_id', $request->input('documentable_id'));
        }

        $documents = $query->latest()->get();

        return response()->json($documents);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('documents.upload');

        $validated = $request->validate([
            'documentable_type' => 'required|string',
            'documentable_id' => 'required|integer',
            'file' => 'required|file|max:10240', // 10MB max
            'name' => 'nullable|string|max:255',
        ]);

        $file = $request->file('file');
        $path = $file->store('documents/' . date('Y/m'), 's3');

        $document = Document::create([
            'user_id' => $request->user()->id,
            'documentable_type' => $validated['documentable_type'],
            'documentable_id' => $validated['documentable_id'],
            'name' => $validated['name'] ?? $file->getClientOriginalName(),
            'file_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'disk' => 's3',
            'path' => $path,
            'size' => $file->getSize(),
        ]);

        return response()->json($document->load('user'), 201);
    }

    public function show(Document $document): JsonResponse
    {
        $this->authorize('documents.view');

        return response()->json($document->load('user'));
    }

    public function download(Document $document): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $this->authorize('documents.view');

        return Storage::disk($document->disk)->download($document->path, $document->file_name);
    }

    public function destroy(Document $document): JsonResponse
    {
        $this->authorize('documents.upload');

        $document->deleteFile();
        $document->delete();

        return response()->json(['message' => 'Document supprime avec succes.']);
    }
}
