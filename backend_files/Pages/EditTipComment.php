<?php
namespace App\Filament\Resources\TipCommentResource\Pages;

use App\Filament\Resources\TipCommentResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditTipComment extends EditRecord
{
    protected static string $resource = TipCommentResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
