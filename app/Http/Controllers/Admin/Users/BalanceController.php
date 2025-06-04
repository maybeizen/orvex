<?php

namespace App\Http\Controllers\Admin\Users;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class BalanceController extends Controller
{

    public function adjustBalance(Request $request, $id)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'action' => 'required|in:add,subtract',
            'note' => 'nullable|string|max:255',
        ]);

        $user = User::findOrFail($id);
        $amount = (float) $request->amount;
        
        if ($request->action === 'add') {
            $user->balance = (float) $user->balance + $amount;
        } else {
            if ((float) $user->balance < $amount) {
                return back()->withErrors(['amount' => 'Insufficient balance for deduction']);
            }
            $user->balance = (float) $user->balance - $amount;
        }
        
        $user->save();
        
        // transaction log stuff goes here once i implement it
        
        return back()->with('success', 'Balance adjusted successfully');
    }
} 