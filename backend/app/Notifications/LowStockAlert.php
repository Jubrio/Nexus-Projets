<?php

namespace App\Notifications;

use App\Models\Product;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LowStockAlert extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Product $product)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Alerte stock bas : ' . $this->product->name)
            ->line('Le produit **' . $this->product->name . '** a atteint un niveau de stock critique.')
            ->line('Stock actuel : **' . $this->product->totalStock() . '**')
            ->line('Seuil d\'alerte : **' . $this->product->low_stock_threshold . '**')
            ->action('Voir le produit', config('app.frontend_url') . '/inventory/products/' . $this->product->id)
            ->line('Merci de reapprovisionner des que possible.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'low_stock_alert',
            'product_id' => $this->product->id,
            'product_name' => $this->product->name,
            'current_stock' => $this->product->totalStock(),
            'threshold' => $this->product->low_stock_threshold,
            'message' => 'Le produit "' . $this->product->name . '" est en stock bas (' . $this->product->totalStock() . ' unites).',
        ];
    }
}
