<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

\App\Models\RequestModel::all()->each(function($r) {
    if (!$r->slug) {
        $r->slug = \Illuminate\Support\Str::slug($r->title) . '-' . $r->id;
        $r->save();
    }
});
