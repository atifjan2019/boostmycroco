<?php
namespace App\Filament\Resources;

use App\Filament\Resources\TipCommentResource\Pages;
use App\Models\TipComment;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Tables\Filters\SelectFilter;
use Filament\Infolists;
use Filament\Infolists\Infolist;

class TipCommentResource extends Resource
{
    protected static ?string $model = TipComment::class;
    protected static ?string $navigationIcon = 'heroicon-o-chat-bubble-left-right';
    protected static ?string $navigationLabel = 'Comments';
    protected static ?string $navigationGroup = 'Communications';
    protected static ?int $navigationSort = 2;

    public static function getNavigationBadge(): ?string
    {
        return static::getModel()::where('status', 'pending')->count() ?: null;
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'warning';
    }

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\TextInput::make('user_name')
                ->label('User Name')
                ->disabled(),
            Forms\Components\Select::make('status')
                ->options([
                    'approved' => 'Approved',
                    'pending' => 'Pending',
                    'spam' => 'Spam',
                ])
                ->required(),
            Forms\Components\Textarea::make('content')
                ->label('Comment')
                ->rows(5)
                ->required()
                ->maxLength(1000),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('user_name')
                    ->label('User')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('content')
                    ->label('Comment')
                    ->limit(60)
                    ->searchable(),
                Tables\Columns\TextColumn::make('tip.title')
                    ->label('Article')
                    ->limit(30)
                    ->sortable(),
                Tables\Columns\BadgeColumn::make('status')
                    ->colors([
                        'success' => 'approved',
                        'warning' => 'pending',
                        'danger' => 'spam',
                    ]),
                Tables\Columns\IconColumn::make('has_url')
                    ->label('URL')
                    ->boolean()
                    ->trueIcon('heroicon-o-link')
                    ->falseIcon('heroicon-o-minus')
                    ->trueColor('warning')
                    ->falseColor('gray'),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Date')
                    ->dateTime('d M Y, H:i')
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                SelectFilter::make('status')
                    ->options([
                        'approved' => 'Approved',
                        'pending' => 'Pending',
                        'spam' => 'Spam',
                    ]),
                Tables\Filters\TernaryFilter::make('has_url')
                    ->label('Contains URL'),
            ])
            ->actions([
                Tables\Actions\Action::make('approve')
                    ->label('Approve')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->action(fn ($record) => $record->update(['status' => 'approved']))
                    ->visible(fn ($record) => $record->status !== 'approved')
                    ->requiresConfirmation(),
                Tables\Actions\Action::make('spam')
                    ->label('Spam')
                    ->icon('heroicon-o-no-symbol')
                    ->color('warning')
                    ->action(fn ($record) => $record->update(['status' => 'spam']))
                    ->visible(fn ($record) => $record->status !== 'spam')
                    ->requiresConfirmation(),
                Tables\Actions\EditAction::make(),
                Tables\Actions\Action::make('delete')
                    ->label('Delete')
                    ->icon('heroicon-m-trash')
                    ->color('danger')
                    ->action(fn ($record) => $record->delete())
                    ->requiresConfirmation(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\BulkAction::make('bulk_approve')
                        ->label('Approve Selected')
                        ->icon('heroicon-o-check-circle')
                        ->color('success')
                        ->action(fn ($records) => $records->each->update(['status' => 'approved']))
                        ->requiresConfirmation()
                        ->deselectRecordsAfterCompletion(),
                    Tables\Actions\BulkAction::make('bulk_spam')
                        ->label('Mark as Spam')
                        ->icon('heroicon-o-no-symbol')
                        ->color('warning')
                        ->action(fn ($records) => $records->each->update(['status' => 'spam']))
                        ->requiresConfirmation()
                        ->deselectRecordsAfterCompletion(),
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListTipComments::route('/'),
            'edit' => Pages\EditTipComment::route('/{record}/edit'),
        ];
    }
}
