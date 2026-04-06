#!/bin/bash
# BoostMyCroco Comment System Setup
# Run: bash /tmp/setup_comments.sh

cd ~/public_html

echo "=== Creating migration ==="
php artisan make:migration create_tip_comments_table --create=tip_comments 2>/dev/null

# Find and overwrite the migration
MIGFILE=$(ls -t database/migrations/*create_tip_comments_table*.php 2>/dev/null | head -1)
if [ -z "$MIGFILE" ]; then
    MIGFILE="database/migrations/2026_04_06_180000_create_tip_comments_table.php"
fi

php -r "
file_put_contents('$MIGFILE', '<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create(\"tip_comments\", function (Blueprint \\\$table) {
            \\\$table->id();
            \\\$table->unsignedBigInteger(\"tip_id\");
            \\\$table->unsignedBigInteger(\"user_id\");
            \\\$table->string(\"user_name\");
            \\\$table->text(\"content\");
            \\\$table->enum(\"status\", [\"approved\", \"pending\", \"spam\"])->default(\"approved\");
            \\\$table->boolean(\"has_url\")->default(false);
            \\\$table->timestamps();
            \\\$table->index(\"tip_id\");
            \\\$table->index(\"user_id\");
            \\\$table->index(\"status\");
        });
    }
    public function down(): void {
        Schema::dropIfExists(\"tip_comments\");
    }
};
');
echo 'Migration file written to: $MIGFILE' . PHP_EOL;
"

echo "=== Running migration ==="
php artisan migrate --force

echo "=== Creating TipComment model ==="
php -r "
file_put_contents('app/Models/TipComment.php', '<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TipComment extends Model
{
    protected \\\$fillable = [\"tip_id\", \"user_id\", \"user_name\", \"content\", \"status\", \"has_url\"];

    protected \\\$casts = [\"has_url\" => \"boolean\"];

    public function tip()
    {
        return \\\$this->belongsTo(Tip::class, \"tip_id\");
    }

    public function user()
    {
        return \\\$this->belongsTo(User::class, \"user_id\");
    }

    public function scopeApproved(\\\$query)
    {
        return \\\$query->where(\"status\", \"approved\");
    }

    public function scopePending(\\\$query)
    {
        return \\\$query->where(\"status\", \"pending\");
    }

    public function scopeSpam(\\\$query)
    {
        return \\\$query->where(\"status\", \"spam\");
    }

    public static function containsUrl(string \\\$text): bool
    {
        return (bool) preg_match(\"/https?:\\\\/\\\\/|www\\\\.|\\\\.(com|net|org|io|co)\\\\b/i\", \\\$text);
    }
}
');
echo 'Model created.' . PHP_EOL;
"

echo "=== Creating TipCommentController ==="
php -r "
file_put_contents('app/Http/Controllers/TipCommentController.php', '<?php
namespace App\Http\Controllers;

use App\Models\TipComment;
use App\Models\Tip;
use Illuminate\Http\Request;

class TipCommentController extends Controller
{
    public function index(\\\$slug)
    {
        \\\$tip = Tip::where(\"slug\", \\\$slug)->first();
        if (!\\\$tip) return response()->json([], 200);
        \\\$comments = TipComment::where(\"tip_id\", \\\$tip->id)->approved()->orderBy(\"created_at\", \"desc\")->get();
        return response()->json(\\\$comments);
    }

    public function store(Request \\\$request, \\\$slug)
    {
        \\\$tip = Tip::where(\"slug\", \\\$slug)->first();
        if (!\\\$tip) return response()->json([\"error\" => \"Tip not found\"], 404);
        \\\$request->validate([\"content\" => \"required|string|min:3|max:1000\"]);
        \\\$user = \\\$request->user();
        \\\$content = \\\$request->content;
        \\\$hasUrl = TipComment::containsUrl(\\\$content);
        \\\$status = \\\$hasUrl ? \"pending\" : \"approved\";
        \\\$comment = TipComment::create([
            \"tip_id\" => \\\$tip->id,
            \"user_id\" => \\\$user->id,
            \"user_name\" => \\\$user->name,
            \"content\" => \\\$content,
            \"status\" => \\\$status,
            \"has_url\" => \\\$hasUrl,
        ]);
        return response()->json(\\\$comment, 201);
    }
}
');
echo 'Controller created.' . PHP_EOL;
"

echo "=== Creating Filament Resource ==="
mkdir -p app/Filament/Resources/TipCommentResource/Pages

php -r "
file_put_contents('app/Filament/Resources/TipCommentResource.php', '<?php
namespace App\Filament\Resources;

use App\Filament\Resources\TipCommentResource\Pages;
use App\Models\TipComment;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Tables\Filters\SelectFilter;

class TipCommentResource extends Resource
{
    protected static ?string \\\$model = TipComment::class;
    protected static ?string \\\$navigationIcon = \"heroicon-o-chat-bubble-left-right\";
    protected static ?string \\\$navigationLabel = \"Comments\";
    protected static ?string \\\$navigationGroup = \"Communications\";
    protected static ?int \\\$navigationSort = 2;

    public static function getNavigationBadge(): ?string
    {
        return static::getModel()::where(\"status\", \"pending\")->count() ?: null;
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return \"warning\";
    }

    public static function form(Form \\\$form): Form
    {
        return \\\$form->schema([
            Forms\Components\TextInput::make(\"user_name\")->label(\"User Name\")->disabled(),
            Forms\Components\Select::make(\"status\")->options([\"approved\" => \"Approved\", \"pending\" => \"Pending\", \"spam\" => \"Spam\"])->required(),
            Forms\Components\Textarea::make(\"content\")->label(\"Comment\")->rows(5)->required()->maxLength(1000),
        ]);
    }

    public static function table(Table \\\$table): Table
    {
        return \\\$table
            ->columns([
                Tables\Columns\TextColumn::make(\"user_name\")->label(\"User\")->searchable()->sortable(),
                Tables\Columns\TextColumn::make(\"content\")->label(\"Comment\")->limit(60)->searchable(),
                Tables\Columns\TextColumn::make(\"tip.title\")->label(\"Article\")->limit(30)->sortable(),
                Tables\Columns\BadgeColumn::make(\"status\")->colors([\"success\" => \"approved\", \"warning\" => \"pending\", \"danger\" => \"spam\"]),
                Tables\Columns\IconColumn::make(\"has_url\")->label(\"URL\")->boolean()->trueIcon(\"heroicon-o-link\")->falseIcon(\"heroicon-o-minus\")->trueColor(\"warning\")->falseColor(\"gray\"),
                Tables\Columns\TextColumn::make(\"created_at\")->label(\"Date\")->dateTime(\"d M Y, H:i\")->sortable(),
            ])
            ->defaultSort(\"created_at\", \"desc\")
            ->filters([
                SelectFilter::make(\"status\")->options([\"approved\" => \"Approved\", \"pending\" => \"Pending\", \"spam\" => \"Spam\"]),
                Tables\Filters\TernaryFilter::make(\"has_url\")->label(\"Contains URL\"),
            ])
            ->actions([
                Tables\Actions\Action::make(\"approve\")->label(\"Approve\")->icon(\"heroicon-o-check-circle\")->color(\"success\")->action(fn (\\\$record) => \\\$record->update([\"status\" => \"approved\"]))->visible(fn (\\\$record) => \\\$record->status !== \"approved\")->requiresConfirmation(),
                Tables\Actions\Action::make(\"spam\")->label(\"Spam\")->icon(\"heroicon-o-no-symbol\")->color(\"warning\")->action(fn (\\\$record) => \\\$record->update([\"status\" => \"spam\"]))->visible(fn (\\\$record) => \\\$record->status !== \"spam\")->requiresConfirmation(),
                Tables\Actions\EditAction::make(),
                Tables\Actions\Action::make(\"delete\")->label(\"Delete\")->icon(\"heroicon-m-trash\")->color(\"danger\")->action(fn (\\\$record) => \\\$record->delete())->requiresConfirmation(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\BulkAction::make(\"bulk_approve\")->label(\"Approve Selected\")->icon(\"heroicon-o-check-circle\")->color(\"success\")->action(fn (\\\$records) => \\\$records->each->update([\"status\" => \"approved\"]))->requiresConfirmation()->deselectRecordsAfterCompletion(),
                    Tables\Actions\BulkAction::make(\"bulk_spam\")->label(\"Mark as Spam\")->icon(\"heroicon-o-no-symbol\")->color(\"warning\")->action(fn (\\\$records) => \\\$records->each->update([\"status\" => \"spam\"]))->requiresConfirmation()->deselectRecordsAfterCompletion(),
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array { return []; }

    public static function getPages(): array
    {
        return [
            \"index\" => Pages\ListTipComments::route(\"/\"),
            \"edit\" => Pages\EditTipComment::route(\"/{record}/edit\"),
        ];
    }
}
');
echo 'Filament Resource created.' . PHP_EOL;
"

php -r "
file_put_contents('app/Filament/Resources/TipCommentResource/Pages/ListTipComments.php', '<?php
namespace App\Filament\Resources\TipCommentResource\Pages;

use App\Filament\Resources\TipCommentResource;
use Filament\Resources\Pages\ListRecords;

class ListTipComments extends ListRecords
{
    protected static string \\\$resource = TipCommentResource::class;
}
');
file_put_contents('app/Filament/Resources/TipCommentResource/Pages/EditTipComment.php', '<?php
namespace App\Filament\Resources\TipCommentResource\Pages;

use App\Filament\Resources\TipCommentResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditTipComment extends EditRecord
{
    protected static string \\\$resource = TipCommentResource::class;

    protected function getHeaderActions(): array
    {
        return [Actions\DeleteAction::make()];
    }
}
');
echo 'Filament Pages created.' . PHP_EOL;
"

echo "=== Adding API routes ==="
# Check if routes already exist
if ! grep -q "tip_comments\|TipCommentController" routes/api.php; then
    php -r "
    \$routes = PHP_EOL . '// Tip Comments' . PHP_EOL;
    \$routes .= 'Route::get(\"/tips-and-tricks/{slug}/comments\", [\\App\\Http\\Controllers\\TipCommentController::class, \"index\"]);' . PHP_EOL;
    \$routes .= 'Route::post(\"/tips-and-tricks/{slug}/comments\", [\\App\\Http\\Controllers\\TipCommentController::class, \"store\"])->middleware(\"auth:sanctum\");' . PHP_EOL;
    file_put_contents('routes/api.php', \$routes, FILE_APPEND);
    echo 'Routes added.' . PHP_EOL;
    "
else
    echo "Routes already exist, skipping."
fi

echo "=== Clearing caches ==="
php artisan route:clear
php artisan config:clear
php artisan cache:clear
php artisan filament:cache-components 2>/dev/null

echo ""
echo "✅ DONE! Comment system is ready."
echo "   - tip_comments table migrated"
echo "   - TipComment model created"
echo "   - API: GET/POST /api/tips-and-tricks/{slug}/comments"
echo "   - Admin: Comments page in Filament sidebar"
