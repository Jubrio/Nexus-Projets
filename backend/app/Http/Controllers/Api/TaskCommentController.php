<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskCommentController extends Controller
{
    public function index(Request $request, Task $task): JsonResponse
    {
        $this->authorize('projects.view');

        return response()->json($task->comments()->with('user')->get());
    }

    public function store(Request $request, Task $task): JsonResponse
    {
        $this->authorize('tickets.create');

        $validated = $request->validate([
            'content' => 'required|string|max:2000',
        ]);

        $comment = $task->comments()->create([
            'user_id' => $request->user()->id,
            'content' => $validated['content'],
        ]);

        return response()->json($comment->load('user'), 201);
    }
}
